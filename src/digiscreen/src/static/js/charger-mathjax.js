window.MathJax = {
	options: {
		enableMenu: false
	},
    tex: {
        inlineMath: [
            ['\\(', '\\)']
        ],
        displayMath: [
            ['$$', '$$'],
            ['\\[', '\\]']
        ]
    }
};

(function () {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
    script.async = true;
    document.head.appendChild(script);
})();

