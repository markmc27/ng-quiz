var express = require('express');
var router = express.Router();

/* GET presenter's page. */
router.get('/', function(req, res) {
	res.sendfile('./public/presenter.html'); // load the single view file (angular will handle the page changes on the front-end)
});

module.exports = router;
