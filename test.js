const test = require('tape')
const crawler = require('./crawler')

const user = 'sepiropht'
const pass = 'azerty'
const courses = 'javascript-basics' 

test('test scraper', function(t) {
	crawler({user, pass, courses}).then(res => {
		t.equal(res.length, 19)
		t.equal(res[0].fileName, '1-introduction.mp4')
		t.equal(res[18].fileName, '19-ecmascript-6.mp4')
		t.end()
	})
})
test.onFinish(() => process.exit(0))
