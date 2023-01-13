.SUFFIXES:
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables
MAKEFLAGS += --warn-undefined-variables

##############################################


.PHONY: dev
dev:
	BROWSER=none npx netlify-cli dev


.PHONY: deploy-preview
deploy-preview: lint
	DEBUG='*' npx netlify-cli deploy


.PHONY: deploy-publish
deploy-publish: lint
	DEBUG='*' npx netlify-cli deploy --prod


##############################################

.PHONY: lint
lint:
	npx prettier --write .
	deno fmt
	deno lint


.PHONY: clean
clean:
	rm -rf .netlify
