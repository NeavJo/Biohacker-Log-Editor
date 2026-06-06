function updateProgressBar(progress) {
  const progressBar = document.getElementById('progressBar');
  if (!progressBar) return;

  progress = Math.max(0, Math.min(100, progress));

  let gradient;
  if (progress <= 0) {
    gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
      rgba(83,140,98,0.85) 0%, 
      rgba(0,183,49,0.85) 0%, 
      rgba(123,214,147,0.85) 0%, 
      rgba(0,183,49,0.85) 0%, 
      rgba(83,140,98,0.85) 0%, 
      rgba(200,200,200,0.6) 0%, 
      rgba(200,200,200,0.6) 100%)`;
  } else if (progress <= 25) {
    gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
      rgba(83,140,98,0.85) 0%, 
      rgba(0,183,49,0.85) ${progress * 0.98}%, 
      rgba(200,200,200,0.6) ${progress}%, 
      rgba(200,200,200,0.6) 100%)`;
  } else if (progress <= 50) {
    gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
      rgba(83,140,98,0.85) 0%, 
      rgba(0,183,49,0.85) 24.52%, 
      rgba(123,214,147,0.85) ${progress * 0.98}%, 
      rgba(200,200,200,0.6) ${progress}%, 
      rgba(200,200,200,0.6) 100%)`;
  } else if (progress <= 75) {
    gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
      rgba(83,140,98,0.85) 0%, 
      rgba(0,183,49,0.85) 24.52%, 
      rgba(123,214,147,0.85) 50%, 
      rgba(0,183,49,0.85) ${progress * 0.98}%, 
      rgba(200,200,200,0.6) ${progress}%, 
      rgba(200,200,200,0.6) 100%)`;
  } else {
    gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
      rgba(83,140,98,0.85) 0%, 
      rgba(0,183,49,0.85) 24.52%, 
      rgba(123,214,147,0.85) 50%, 
      rgba(0,183,49,0.85) 75%, 
      rgba(83,140,98,0.85) ${progress * 0.98}%, 
      rgba(200,200,200,0.6) ${progress}%, 
      rgba(200,200,200,0.6) 100%)`;
  }
  progressBar.style.background = gradient;
}

function fadeOutProgressBar(callback) {
  const loadingState = document.getElementById('loadingState');
  const cardsContainer = document.getElementById('cardsContainer');
  const paginationContainer = document.getElementById('paginationContainer');
  let opacity = 1;
  const fadeInterval = setInterval(() => {
    opacity -= 0.05;
    loadingState.style.opacity = opacity;
    if (opacity <= 0) {
      clearInterval(fadeInterval);
      loadingState.style.opacity = 1;
      loadingState.classList.add('hidden');
      cardsContainer.style.visibility = 'visible';
      paginationContainer.style.visibility = 'visible';
      const cards = cardsContainer.querySelectorAll('.glass-window');
      cards.forEach((card, index) => {
        card.classList.remove('card-animation');
        void card.offsetWidth;
        card.classList.add('card-animation');
        card.style.animationDelay = `${index * 0.1}s`;
      });
      callback();
    }
  }, 30);
}
