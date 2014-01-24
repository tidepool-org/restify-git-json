
BLANKET=--require blanket 
SHOULD=--require should

clean:
	mkdir -p out
	rm -Rf out/foobar/
	rm -Rf out/testUser/
	rm -Rf out/fooTestUser/
	mkdir -p out/fooTestUser/
	rm -f /tmp/test-restify-git-json.sock

travis-cov: clean
	make clean
	NODE_ENV=test node_modules/.bin/mocha  ${BLANKET} ${SHOULD} -R 'travis-cov' ./test/test*.js

coveralls: clean
	make clean
	NODE_ENV=test \
	./node_modules/.bin/mocha ${BLANKET} ${SHOULD}  -R mocha-lcov-reporter \
    test/test*.js | ./coverall.sh && echo "reported coveralls" || echo "oops"

coverhtml: clean
	make clean
	./node_modules/.bin/mocha ${BLANKET} ${SHOULD}  -R html-cov test/*.js > test/coverage.html

precover: clean
	make clean
	./node_modules/.bin/mocha ${BLANKET} ${SHOULD} -R html-cov test/*.js | w3m -T text/html

test: clean
	make clean
	mocha --verbose --require should -R tap test/*.js

travis: clean test travis-cov coveralls coverhtml

.PHONY: test clean
