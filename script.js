(() => {
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const nameInput = document.getElementById('nameInput');
  const addNameButton = document.getElementById('addNameButton');
  const spinButton = document.getElementById('spinButton');
  const nameList = document.getElementById('nameList');
  const controls = document.getElementById('controls');

  // Increase the canvas size to accommodate the larger wheel and ensure the arrow stays in view
  canvas.width = 600; // Adjusted width for larger wheel
  canvas.height = 600; // Adjusted height for larger wheel
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Increase radius by 1/3 (from 200 to 266)
  const radius = 266;

  let names = [];
  let anglePerName;
  let currentAngle = 0;
  let spinVelocity = 0;
  let spinning = false;

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

  function getColor() {
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
      names.push(name);

      // Assign a color from the predefined array or generate a random one
      const color = getColor();
      assignedColors.push(color);

      nameInput.value = ''; // Clear the input field
      updateNameList();
      drawWheel();
    }
  }

  // Update the name list display
  function updateNameList() {
    nameList.innerHTML = '';
    names.forEach((name, index) => {
      const li = document.createElement('li');
      li.textContent = name;
      li.style.backgroundColor = assignedColors[index];

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
    names.splice(index, 1);
    assignedColors.splice(index, 1);
    updateNameList();
    drawWheel();
  }

  // Draw the wheel
  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If there are no names, draw the dotted circle
    if (names.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.setLineDash([15, 15]); // Dotted line style
      ctx.fillStyle = 'rgb(222, 174, 18)';
      ctx.fill();
      ctx.font = '100px Georgia';
      ctx.fillStyle = 'white';
      ctx.fillText('Euchre', centerX - 155, centerY - 20);
      ctx.fillText('Night!!!', centerX - 155, centerY + 95);
      return;
    }

    spinButton.style.opacity = 1;

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
      ctx.font = '16px Arial';
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

  // Spin the wheel
  spinButton.addEventListener('click', () => {
    if (!spinning && names.length > 0) {
      const randomSpinVelocity = Math.random() * 5 + 10; // Random spin velocity between 10 and 15
      spinVelocity = randomSpinVelocity; // Set the initial spin velocity
      spinning = true;
      const controlsWidth = controls.getBoundingClientRect().width;
      controls.remove();
      canvas.style.paddingLeft = controlsWidth + 'px';
      spinButton.style.opacity = 0;

      setTimeout(() => {
        canvas.classList.add('slide');
        canvas.style.paddingLeft = 0;
      }, 0);

      setTimeout(() => {
        requestAnimationFrame(spin);
      }, 1000);
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

    // Show the modal after the animation
    setTimeout(() => {
      const modal = document.getElementById('modal');
      modal.classList.add('animated');
      modal.style.display = 'block'; // Show the modal
      modal.style.backgroundColor = winnerLi.style.backgroundColor;
      winnerName.innerHTML = winnerNameText;
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
    const namesParam = urlParams.get('names');
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

  function makeWaves() {
    const container = document.querySelector('.wave-container');
    const waveCount = 20; // Number of falling balls

    for (let i = 0; i < waveCount; i++) {
      const wave = document.createElement('div');
      wave.classList.add('wave');

      // Randomize size
      const size = Math.random() * 150 + 50; // Size between 50px and 200px
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;

      // Randomize horizontal position
      wave.style.left = `${Math.random() * 100}vw`;

      // Randomize speed
      const speed = Math.random() * 10 + 12; // Speed between 5s and 15s
      wave.style.animationDuration = `${speed}s`;

      // Randomize delay
      const delay = Math.random() * -10; // Delay between -10s and 0s
      wave.style.animationDelay = `${delay}s`;

      // Randomize opacity slightly
      wave.style.opacity = 0.4;

      // **NEW: Randomize background color for each wave**
      const hue = Math.random() * 360; // Full hue spectrum
      const saturation = Math.random() * 30 + 70; // Saturation between 70-100%
      const lightness = Math.random() * 20 + 50; // Lightness between 50-70%
      wave.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      container.appendChild(wave);
    }
  }

  loadNamesFromUrlParams();

  makeWaves();

  // Initial draw
  drawWheel();
})();
