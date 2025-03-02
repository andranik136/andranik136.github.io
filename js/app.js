particlesJS.load('particles-js', '/particles.json', function() {
	console.log('callback - particles.js config loaded');
	
	var userContent = document.getElementById('user_content');
	
	delay(0).then(() => userContent.classList.add('show'));
});