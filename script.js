(() => {
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const nameInput = document.getElementById('nameInput');
  const questionInput = document.getElementById('nameQuestion');
  const addNameButton = document.getElementById('addNameButton');
  const spinButton = document.getElementById('spinButton');
  const nameList = document.getElementById('nameList');
  const controls = document.getElementById('controls');
  const modal = document.getElementById('modal');
  const wheelContainer = document.getElementById('wheelContainer');
  const closeModalButton = document.querySelector('.close-modal');

  // Make these let so they can be updated dynamically
  let centerX, centerY, radius;

  // Helper function to detect mobile
  function isMobile() {
    return window.innerWidth <= 600;
  }

  // Responsive canvas sizing
  function resizeCanvas() {
    let size;
    if (window.innerWidth <= 600) {
      size = Math.max(Math.min(window.innerWidth * 0.9, 380), 220); // min 220px, max 380px, 90vw
    } else if (window.innerWidth < 900) {
      size = 420;
    } else {
      size = 600;
    }
    canvas.width = size;
    canvas.height = size;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    radius = Math.floor(canvas.width * 0.44); // Dynamically scale radius (original ratio)
  }

  // Resize if mobile/tablet/desktop version
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawWheel();
    
    // Handle button visibility on resize (mobile/desktop switch)
    if (isMobile() && names.length >= 2 && !spinning) {
      showSpinButton();
    } else if (!isMobile() && names.length >= 2 && !spinning) {
      // On desktop, hide button initially (will show on hover)
      hideSpinButton();
    }
  });

  // Add precise mouse move detection for wheel hover effect
  canvas.addEventListener('mousemove', (event) => {
    if (names.length >= 2 && !spinning) {
      // On mobile, don't require hover - button is always visible when there are 2+ options
      if (isMobile()) {
        showSpinButton();
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Calculate distance from center of the wheel
      const distanceFromCenter = Math.sqrt(
        Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
      );
      
      // Show button only when cursor is within the wheel radius
      if (distanceFromCenter <= radius) {
        showSpinButton();
      } else {
        hideSpinButton();
      }
    } else {
      // Always hide button if there are less than 2 names
      hideSpinButton();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    // On mobile, don't hide the button on mouse leave if there are 2+ options
    if (isMobile() && names.length >= 2 && !spinning) {
      return;
    }
    hideSpinButton();
  });

  // Add mouse enter/leave event listeners for the spin button to prevent it from disappearing
  spinButton.addEventListener('mouseenter', () => {
    if (names.length >= 2 && !spinning) {
      showSpinButton();
    }
  });

  spinButton.addEventListener('mouseleave', () => {
    // On mobile, don't hide the button on mouse leave if there are 2+ options
    if (isMobile() && names.length >= 2 && !spinning) {
      return;
    }
    hideSpinButton();
  });

  let names = [];
  let anglePerName;
  let currentAngle = 0;
  let spinVelocity = 0;
  let spinning = false;
  let transitioning = false; // Track if we're in transition animation

  const predefinedColors = [
    '#FFBC70',
    '#5FCFFF',
    '#B23A3A',
    '#D3BEEA',
    '#35816E',
    '#FEA379',
    '#2B83C6',
    '#BD8A6A',
    '#DDE38C',
    '#FFDF61',
    '#5D84A2',
    '#74B959',
    '#E41F84',
    '#A2C7E3',
    '#FF9162',
    '#3A693F',
    '#E1ADE7',
    '#D0BBCE',
    '#285E86',
    '#BDAA3E',
  ];

  let assignedColors = [];

  // Store the empty wheel color to assign to the first option
  let emptyWheelColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];

  function hideSpinButton() {
    spinButton.style.opacity = 0;
    spinButton.style.pointerEvents = 'none';
    spinButton.style.cursor = 'default';
  }

  function showSpinButton() {
    if (names.length >= 2 && !spinning) {
      spinButton.style.opacity = 1;
      spinButton.style.pointerEvents = 'auto';
      spinButton.style.cursor = 'pointer';
    }
  }

  function getColor() {
    // If this is the first option, use the empty wheel color
    if (assignedColors.length === 0) {
      return emptyWheelColor;
    }
    
    if (assignedColors.length < predefinedColors.length) {
      let randomColor;
      do {
        randomColor =
          predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
      } while (assignedColors.includes(randomColor)); // Make sure the color hasn't been used already
      return randomColor;
    } else {
      // If we run out of predefined colors, generate a random color
      const hue = Math.floor(Math.random() * 360);
      const saturation = Math.floor(Math.random() * 20) + 70;
      const lightness = Math.floor(Math.random() * 20) + 40;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  }

  // Helper function to convert color to rgba with transparency
  function colorToRgba(color, alpha = 0.8) {
    // Create a temporary element to get computed color
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    document.body.appendChild(tempElement);
    
    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);
    
    // Extract RGB values from computed color
    const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Fallback for hex colors
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Return original color if conversion fails
    return color;
  }

  // Add event listener for closing modal
  closeModalButton.addEventListener('click', () => {
    closeModal();
  });

  function closeModal() {
    // Remove winner mode class from wheel container
    wheelContainer.classList.remove('winner-mode');
    
    // Hide modal
    modal.style.display = 'none';
    modal.classList.remove('animated');
    modal.style.backgroundColor = '';
    
    // Remove confetti
    const confettiContainers = document.querySelectorAll('.confetti-container');
    confettiContainers.forEach(container => container.remove());
    
    // Restore controls
    const mainContainer = document.getElementById('mainContainer');
    if (!document.getElementById('controls')) {
      mainContainer.insertBefore(controls, mainContainer.firstChild);
    }
    
    // Reset canvas position
    canvas.classList.remove('slide');
    canvas.style.paddingLeft = '0';
    
    // Reset spinning state
    spinning = false;
    spinVelocity = 0;
    
    // Restore button functionality (it will be shown on hover)
    spinButton.style.pointerEvents = 'auto';
    spinButton.style.cursor = 'pointer';
  }

  // Add a name to the wheel
  addNameButton.addEventListener('click', () => {
    addNameToWheel();
  });

  nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default action (form submission)
      addNameToWheel();
    }
  });

  function addNameToWheel() {
    const name = nameInput.value.trim();
    if (name && !names.includes(name)) {
      const wasEmpty = names.length === 0;
      
      names.push(name);

      // Assign a color from the predefined array or generate a random one
      const color = getColor();
      assignedColors.push(color);

      nameInput.value = ''; // Clear the input field
      updateNameList();
      
      // If this is the first option, animate the transition
      if (wasEmpty) {
        animateEmptyToWheel();
      } else {
        drawWheel();
      }
      
      // On mobile, show the spin button if we now have 2+ options
      if (isMobile() && names.length >= 2 && !spinning) {
        showSpinButton();
      }
    }
  }

  // Update the name list display
  function updateNameList() {
    nameList.innerHTML = '';
    names.forEach((name, index) => {
      const li = document.createElement('li');
      li.textContent = name;
      li.style.backgroundColor = colorToRgba(assignedColors[index], 0.8);

      const removeButton = document.createElement('span');
      removeButton.textContent = 'X';
      removeButton.style.marginLeft = '10px';
      removeButton.style.color = 'white';
      removeButton.style.cursor = 'pointer';
      removeButton.addEventListener('click', () => removeName(index));

      li.appendChild(removeButton);
      nameList.appendChild(li);
    });
  }

  function removeName(index) {
    // If we're removing the last remaining option, store its color for the empty wheel
    if (names.length === 1) {
      emptyWheelColor = assignedColors[0];
    }
    
    names.splice(index, 1);
    assignedColors.splice(index, 1);
    updateNameList();
    
    // If we're going back to empty, animate the reverse transition
    if (names.length === 0) {
      animateWheelToEmpty();
    } else {
      drawWheel();
    }
    
    // On mobile, hide the spin button if we now have less than 2 options
    if (isMobile() && names.length < 2) {
      hideSpinButton();
    }
  }

  // Draw the wheel
  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const wheelTextOverlay = document.getElementById('wheelTextOverlay');

    // If there are no names, show the overlay text and draw the dotted circle
    if (names.length === 0) {
      wheelTextOverlay.style.display = 'flex';
      hideSpinButton(); // Ensure button is hidden
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.setLineDash([15, 15]); // Dotted line style
      ctx.fillStyle = colorToRgba(emptyWheelColor, 0.8);
      ctx.fill();
      return;
    }

    // Hide the overlay text when there are names
    wheelTextOverlay.style.display = 'none';

    // If there's only one name, hide the spin button
    if (names.length === 1) {
      hideSpinButton();
    }

    // On mobile, show button immediately if there are 2+ options
    if (isMobile() && names.length >= 2 && !spinning) {
      showSpinButton();
    }

    // Button visibility is now controlled by mouse hover events

    anglePerName = (2 * Math.PI) / names.length;
    names.forEach((name, index) => {
      const startAngle = currentAngle + index * anglePerName;
      const endAngle = startAngle + anglePerName;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = assignedColors[index]; // Use the pre-assigned color for this wedge
      ctx.fill();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerName / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#000';
      ctx.font = "16px 'Arial', 'sans-serif'";
      //   ctx.fillText(name, radius - 10, 0);
      ctx.restore();
    });

    // Draw the arrow
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 15);
    ctx.lineTo(centerX - 10, centerY - radius - 10);
    ctx.lineTo(centerX + 10, centerY - radius - 10);
    ctx.closePath();
    ctx.fill();
  }

  // Animate transition from empty wheel to wheel with first option
  function animateEmptyToWheel() {
    transitioning = true;
    let progress = 0;
    const duration = 800; // 800ms transition
    const startTime = Date.now();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth transition
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      drawTransition(easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        transitioning = false;
        drawWheel();
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  // Draw the transition between empty wheel and first option
  function drawTransition(progress) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const wheelTextOverlay = document.getElementById('wheelTextOverlay');
    
    // Fade out the overlay text
    wheelTextOverlay.style.opacity = 1 - progress;
    if (progress >= 1) {
      wheelTextOverlay.style.display = 'none';
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    
    if (progress < 0.5) {
      // First half: transition from dotted to solid circle
      const dashProgress = 1 - (progress * 2);
      ctx.setLineDash([15 * dashProgress, 15 * dashProgress]);
      ctx.fillStyle = colorToRgba(emptyWheelColor, 0.8);
      ctx.fill();
    } else {
      // Second half: transition to full wheel segment
      ctx.setLineDash([]);
      const segmentProgress = (progress - 0.5) * 2;
      
      // Draw the growing segment
      const endAngle = segmentProgress * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, 0, endAngle);
      ctx.closePath();
      ctx.fillStyle = assignedColors[0];
      ctx.fill();
      
      // Draw the remaining empty area
      if (segmentProgress < 1) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, endAngle, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = colorToRgba(emptyWheelColor, 0.8);
        ctx.fill();
      }
    }
    
    // Always draw the arrow
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 15);
    ctx.lineTo(centerX - 10, centerY - radius - 10);
    ctx.lineTo(centerX + 10, centerY - radius - 10);
    ctx.closePath();
    ctx.fill();
  }

  // Animate transition from wheel with one option back to empty wheel
  function animateWheelToEmpty() {
    transitioning = true;
    let progress = 0;
    const duration = 1200; // 1200ms transition (same as forward)
    const startTime = Date.now();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth transition
      const easeProgress = 1 - Math.pow(1 - progress, 1.5);
      
      drawReverseTransition(easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        transitioning = false;
        drawWheel(); // This will draw the empty wheel
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  // Draw the reverse transition from wheel back to empty
  function drawReverseTransition(progress) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const wheelTextOverlay = document.getElementById('wheelTextOverlay');
    
    if (progress < 0.5) {
      // First half: shrink the segment
      const segmentProgress = 1 - (progress * 2);
      const endAngle = segmentProgress * 2 * Math.PI;
      
      if (segmentProgress > 0) {
        // Draw the shrinking segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, 0, endAngle);
        ctx.closePath();
        ctx.fillStyle = emptyWheelColor;
        ctx.fill();
      }
      
      // Draw the growing empty area
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, endAngle, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = colorToRgba(emptyWheelColor, 0.8);
      ctx.fill();
    } else {
      // Second half: transition from solid to dotted circle
      const dashProgress = (progress - 0.5) * 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.setLineDash([15 * dashProgress, 15 * dashProgress]);
      ctx.fillStyle = colorToRgba(emptyWheelColor, 0.8);
      ctx.fill();
      
      // Fade in the overlay text
      wheelTextOverlay.style.display = 'flex';
      wheelTextOverlay.style.opacity = dashProgress;
    }
    
    // Draw the arrow with fade out effect
    const arrowOpacity = Math.max(0, 1 - (progress * 2)); // Fade out in half the time
    ctx.fillStyle = `rgba(0, 0, 0, ${arrowOpacity})`;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 15);
    ctx.lineTo(centerX - 10, centerY - radius - 10);
    ctx.lineTo(centerX + 10, centerY - radius - 10);
    ctx.closePath();
    ctx.fill();
  }

  // Spin the wheel
  spinButton.addEventListener('click', () => {
    if (!spinning && names.length >= 2) {
      const randomSpinVelocity = (Math.random() * 5 + 10) * 0.55; // Random spin velocity between 7.5 and 11.25 (75% of original)
      spinVelocity = randomSpinVelocity; // Set the initial spin velocity
      spinning = true;
      
      // First fade out the button
      hideSpinButton();
      
      // Wait for button fade out animation to complete (300ms), then start wheel animation
      setTimeout(() => {
        const controlsWidth = controls.getBoundingClientRect().width;
        
        // Set initial padding without transition
        canvas.style.transition = 'none';
        canvas.style.paddingLeft = controlsWidth + 'px';
        
        // Remove controls after setting initial position
        controls.remove();

        // Force a reflow to ensure the padding is applied before starting animation
        canvas.offsetHeight;
        
        // Re-enable transition and start the slide animation
        canvas.style.transition = 'padding 500ms';
        canvas.classList.add('slide');
        canvas.style.paddingLeft = 0;

        setTimeout(() => {
          requestAnimationFrame(spin);
        }, 1000);
      }, 300); // Wait for the 0.3s fade transition to complete
    }
  });

  function spin() {
    if (spinVelocity > 0.001) {
      currentAngle += spinVelocity;
      spinVelocity *= 0.99; // Gradual slowdown
      drawWheel();
      requestAnimationFrame(spin);
    } else {
      spinning = false;
      determineWinner();
    }
  }

  function determineWinner() {
    const normalizedAngle =
      ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // Normalize the angle to [0, 2 * PI]
    const arrowAngle = Math.PI / 2; // Arrow is at the top pointing to 90 degrees
    const effectiveAngle = (normalizedAngle + arrowAngle) % (2 * Math.PI); // Account for arrow's fixed position

    // Invert the direction of the wheel (as it spins clockwise)
    const segmentIndex =
      Math.floor((2 * Math.PI - effectiveAngle) / anglePerName) % names.length;

    animateWinnerAnnouncement(segmentIndex);
  }

  function animateWinnerAnnouncement(segmentIndex) {
    // Get the list items and find the winner's list item
    const listItems = nameList.getElementsByTagName('li');
    const winnerLi = listItems[segmentIndex];

    const winnerNameText = winnerLi.textContent.replace('X', '').trim();
    const questionText = questionInput.value.trim();

    // Show the modal after the animation
    setTimeout(() => {
      // Add winner mode class to wheel container for full viewport positioning
      wheelContainer.classList.add('winner-mode');
      
      modal.classList.add('animated');
      modal.style.display = 'block'; // Show the modal
      modal.style.backgroundColor = assignedColors[segmentIndex]; // Use original color for modal
      
      // Create the content for the modal
      let modalContent = '';
      if (questionText) {
        modalContent = `<div style="font-size: 0.4em; margin-bottom: 20px; text-align: center;">${questionText}</div>${winnerNameText}`;
      } else {
        modalContent = winnerNameText;
      }
      
      winnerName.innerHTML = modalContent;
      generateConfetti();
    }, 1000); // Wait for the animation duration to complete before showing the modal
  }

  function generateConfetti() {
    const numConfetti = 100; // Number of confetti pieces
    const confettiContainer = document.createElement('div');
    confettiContainer.classList.add('confetti-container');
    document.body.appendChild(confettiContainer); // Append the confetti container to the body

    const colors = [
      '#FFBC70',
      '#5FCFFF',
      '#B23A3A',
      '#D3BEEA',
      '#35816E',
      '#FEA379',
      '#2B83C6',
      '#BD8A6A',
      '#DDE38C',
      '#FFDF61',
      '#5D84A2',
      '#74B959',
      '#E41F84',
      '#A2C7E3',
      '#FF9162',
      '#3A693F',
      '#E1ADE7',
      '#D0BBCE',
      '#285E86',
      '#BDAA3E',
    ];

    for (let i = 0; i < numConfetti; i++) {
      const confettiPiece = document.createElement('div');
      confettiPiece.classList.add('confetti');

      // Set random color from the colors array
      const color = colors[Math.floor(Math.random() * colors.length)];
      confettiPiece.style.backgroundColor = color;

      // Set a random horizontal position (from 0% to 100% of the viewport width)
      confettiPiece.style.left = `${Math.random() * 100}vw`;

      // Random animation delay, speed (duration), and rotation for each confetti piece
      const delay = Math.random() * 2; // Random delay between 0 and 2 seconds
      const fallDuration = Math.random() * 3 + 2; // Random fall duration between 2s and 5s
      const rotationStart = Math.random() * 360; // Random start rotation (0-360 degrees)
      const rotationEnd = Math.random() * 360; // Random end rotation (0-360 degrees)

      // Set inline CSS custom properties for delay, duration, and rotation
      confettiPiece.style.setProperty('--delay', `${delay}s`);
      confettiPiece.style.setProperty('--fall-duration', `${fallDuration}s`);
      confettiPiece.style.setProperty(
        '--rotation-start',
        `${rotationStart}deg`,
      );
      confettiPiece.style.setProperty('--rotation-end', `${rotationEnd}deg`);

      // Append the confetti piece to the container
      confettiContainer.appendChild(confettiPiece);
    }
  }

  function loadNamesFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const namesParam = urlParams.get('opcions');
    if (namesParam) {
      const namesArray = namesParam.split(',').map((name) => name.trim());
      namesArray.forEach((name) => {
        if (name && !names.includes(name)) {
          const captializedName = name.charAt(0).toUpperCase() + name.slice(1);
          names.push(captializedName);
          const color = getColor();
          assignedColors.push(color);
        }
      });
      updateNameList();
      drawWheel();
    }
  }

  function makesBubbles() {
    const container = document.querySelector('.bubbles-container');
    const bubbleCount = 20; // Number of falling balls

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement('div');
      bubble.classList.add('bubble');

      // Randomize size
      const size = Math.random() * 150 + 50; // Size between 50px and 200px
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;

      // Randomize horizontal position
      bubble.style.left = `${Math.random() * 100}vw`;

      // Randomize speed
      const speed = Math.random() * 10 + 12; // Speed between 5s and 15s
      bubble.style.animationDuration = `${speed}s`;

      // Randomize delay
      const delay = Math.random() * -10; // Delay between -10s and 0s
      bubble.style.animationDelay = `${delay}s`;

      // Randomize opacity slightly
      bubble.style.opacity = 0.4;

      // **NEW: Randomize background color for each bubble**
      const hue = Math.random() * 360; // Full hue spectrum
      const saturation = Math.random() * 30 + 70; // Saturation between 70-100%
      const lightness = Math.random() * 20 + 50; // Lightness between 50-70%
      bubble.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      container.appendChild(bubble);
    }
  }

  loadNamesFromUrlParams();

  makesBubbles();

  // Initial draw
  drawWheel();
})();
