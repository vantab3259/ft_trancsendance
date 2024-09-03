(function() {
    var progressBar = document.querySelector('.progress-bar');
    var progress = progressBar.querySelector('.progress');
    var value = progressBar.getAttribute('value');
    progress.style.width = value + '%';
});
