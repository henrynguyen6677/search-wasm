.PHONY:
build:
	wasm-pack build --target web

dev:
	ln -s $(pwd)/pkg $(pwd)/www
	npx serve www
