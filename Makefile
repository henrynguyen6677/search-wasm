.PHONY:
build:
	wasm-pack build --target web --out-dir pkg --release
	git add pkg/ && git status
link:
	ln -s $(pwd)/pkg $(pwd)/www
dev:
	( cd frontend && npm run dev )
