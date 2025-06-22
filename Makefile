.PHONY:
build:
	wasm-pack build --target web
link:
	ln -s $(pwd)/pkg $(pwd)/www
dev:
	( cd frontend && npm run dev )
