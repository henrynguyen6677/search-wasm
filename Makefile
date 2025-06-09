.PHONY:
build:
	wasm-pack build --target web
link:
	ln -s $(pwd)/pkg $(pwd)/www
dev:
	npx serve www
