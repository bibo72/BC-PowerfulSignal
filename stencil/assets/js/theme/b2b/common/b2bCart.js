import $ from 'jquery';
import utils from '@bigcommerce/stencil-utils';
import _ from 'lodash';
import swal from 'sweetalert2';

import config from '../config';

const bypass_store_hash = `${config.storeHash}`;

class b2bCart {
	constructor() {
		this.$overlay_b2b = $("#b2b_loading_overlay");

	}

	showCartTips() {
		this.$overlay_b2b.show();
		let cartItemIDs = [];
		let cartId;

		$.ajax({
			type: "GET",
			url: "/api/storefront/carts",
			contentType: "application/json",
			accept: "application/json",
			async: true,
			success: (data) => {
				if (data && data.length > 0) {
					cartId = data[0].id;
					cartItemIDs = data[0].lineItems.physicalItems;
				}

				console.log(cartItemIDs);

				console.log("number of items in cart: ", cartItemIDs.length);
				if (cartItemIDs.length > 0) { //if there are items in cart notify user
					this.$overlay_b2b.hide();
					swal({
						title: "The shopping cart isn't empty",
						html: "<div class='nonempty-cart'><p>You have items in your shopping cart. Would you like to merge items in this order with items of this shopping cart or replace them?</p>" +
							"<p>Select Cancel to stay on the current page.</p></div>",
						showCancelButton: true,
						confirmButtonText: 'Merge',
						cancelButtonText: 'Cancel'
					});
					$(".swal2-confirm.button").after('<button type="button" class="button replace-button">Replace</button>');
				} else {
					this.$overlay_b2b.show();
					this.addProductToCartBundleb2b(itemArr);
				}
				$(".swal2-confirm.button").unbind().bind("click", () => {
					this.$overlay_b2b.show();
					this.addProductToCartBundleb2b(itemArr);
				});
				$(".replace-button").unbind().bind("click", () => {
					swal.close();
					this.$overlay_b2b.show();
					this.replaceCart(cartItemIDs, itemArr);
				});
			},
			error: (jqXHR, textStatus, errorThrown) => {
				this.$overlay_b2b.hide();

				swal({
					type: "error",
					text: "There has some error, please try again"
				});
				console.log("error", JSON.stringify(jqXHR));
			}
		});

	}

	//for bundleb2b
	addProductToCartBundleb2b(itemArr) {
		const $addToCartBtn = $("#form-action-addToCart", this.scope);
		const form = $("[data-cart-item-add]", this.scope)[0];
		const originalBtnVal = $addToCartBtn.val();
		const waitMessage = $addToCartBtn.data('waitMessage');
		$addToCartBtn
			.val(waitMessage)
			.prop('disabled', true);


		const item = itemArr[itemArr.length - 1];

		console.log("add item to cart", item);

		utils.api.cart.itemAdd(this.filterEmptyFilesFromForm(new FormData(form)), (err, response) => {
			const errorMessage = err || response.data.error;

			$addToCartBtn
				.val(originalBtnVal)
				.prop('disabled', false);

			// Guard statement
			if (errorMessage) {
				this.$overlay_b2b.hide();

				// Strip the HTML from the error message
				const tmp = document.createElement('DIV');
				tmp.innerHTML = errorMessage;


				return swal({
					text: tmp.textContent || tmp.innerText,
					type: 'error',
				});
			}

			// Open preview modal and update content
			console.log(response);
			const cartItemHash = response.data.cart_item.hash;


			this.getCartContent(cartItemHash, (err, response) => {
				if (err) {
					this.$overlay_b2b.hide();
					return swal({
						type: 'error',
						text: 'There has some error, please try again.'
					});
				}

				const responseHtml = $(response).find(".productView");
				console.log(responseHtml);


				const options = {
					template: {
						content: 'b2b/cart-content-data',
						totals: 'cart/totals',
						pageTitle: 'cart/page-title',
						statusMessages: 'cart/status-messages',
					},
				};
				utils.api.cart.getContent(options, (err, response) => {
					//console.log(response.content);
					debugger
					const divEle = document.createElement("div");
					$(divEle).html(response.content);
					const $items = $(divEle).find(".item");
					if ($items.length > 0) {

						let cartItemsArr = [];
						let cartItemsObj = {};
						let cartQuantity = 0;
						const gCatalogId = sessionStorage.getItem("catalog_id");

						$.each($items, (index, item) => {
							//console.log(item);
							const $cartItem = $(item);
							const itemId = $cartItem.attr("data-item-id");
							const itemSku = $cartItem.attr("data-item-sku");
							const itemProductId = $cartItem.attr("data-item-productId");
							const itemQty = parseInt($cartItem.attr("data-item-quantity"));
							const itemOptions = $cartItem.attr("data-item-options");

							let itemVariantId;
							const variants = this.catalog_products[itemProductId];
							if (variants && variants.length > 0) {
								for (let i = 0; i < variants.length; i++) {
									const variant_sku = variants[i].variant_sku;
									if (variant_sku.toLowerCase() == itemSku.toLowerCase()) {
										itemVariantId = variants[i].variant_id;
									}
								}

							}

							cartQuantity += parseInt(itemQty);
							//const itemCatalogPrice = catalog_products[itemProductId] || cartItem.salePrice;

							if (cartItemsObj[`${itemProductId}-${itemVariantId}`]) {
								for (let j = 0; j < cartItemsArr.length; j++) {
									if (cartItemsArr[j].product_id == itemProductId && cartItemsArr[j].variant_id == itemVariantId && cartItemsArr[j].option_text == itemOptions) {
										cartItemsArr[j].quantity += parseInt(itemQty);
									}
								}
							} else {
								cartItemsObj[`${itemProductId}-${itemVariantId}`] = "true";
							}


							const cartItemObj = {
								"item_id": itemId,
								"product_id": itemProductId,
								"variant_id": itemVariantId,
								"quantity": itemQty,
								"catalog_id": gCatalogId,
								"option_text": itemOptions
							};

							cartItemsArr.push(cartItemObj);

						});

						//update cart counter
						const $body = $('body');
						const $cartCounter = $('.navUser-action .cart-count');

						$cartCounter.addClass('cart-count--positive');
						$body.trigger('cart-quantity-update', cartQuantity);
						console.log("cartItems", cartItemsArr);

						//$overlay.hide();

						let cartId;
						$.ajax({
							type: "GET",
							url: "../api/storefront/carts",
							contentType: "application/json",
							accept: "application/json",
							async: false,
							success: function(data) {

								if (data && data.length > 0) {
									cartId = data[0].id;

								}
							}
						});
						this.updateCatalogPrice(cartItemsArr, cartId, responseHtml);
					}

				});


				/*$.ajax({
				    type: "GET",
				    url: "/api/storefront/carts",
				    contentType: "application/json",
				    accept: "application/json",
				    success: (data) => {
				        console.log("get cart", data);
				        if (data && data.length > 0) {
				            const cartId = data[0].id;
				            console.log("cartId", cartId);


				            let cartItemsArr = [];
				            let cartItemsObj = {};

				            const product_id = $("input[name=product_id]", this.$scope).val();
				            const product_quantity = $(`input[name="qty[]"`).val();
				            const cartItems = data[0].lineItems.physicalItems;
				            for (let i = 0; i < cartItems.length; i++) {
				                const cartItem = cartItems[i];
				                const itemId = cartItem.id;
				                const itemProductId = cartItem.productId;
				                const itemVariantId = cartItem.variantId;
				                const itemQty = cartItem.quantity;

				                //const itemCatalogPrice = catalog_products[itemProductId] || cartItem.salePrice;

				                if (cartItemsObj[`${itemProductId}-${itemVariantId}`]) {
				                    for (let j = 0; j < cartItemsArr.length; j++) {
				                        if (cartItemsArr[j].product_id == itemProductId && cartItemsArr[j].variant_id == itemVariantId) {
				                            cartItemsArr[j].quantity += itemQty;
				                        }
				                    }
				                } else {
				                    cartItemsObj[`${itemProductId}-${itemVariantId}`] = "true";

				                }


				                const gCatalogId = sessionStorage.getItem("catalog_id");
				                const cartItemObj = {
				                    "item_id": itemId,
				                    "product_id": itemProductId,
				                    "variant_id": itemVariantId,
				                    "quantity": itemQty,
				                    "catalog_id": gCatalogId
				                };

				                cartItemsArr.push(cartItemObj);

				            }
				            console.log(cartItemsArr);

				            //$overlay_b2b.hide();
				            this.updateCatalogPrice(cartItemsArr, cartId, responseHtml);

				        } else {
				            this.$overlay_b2b.hide();
				        }
				    },
				    error: (jqXHR, textStatus, errorThrown) => {
				        this.$overlay_b2b.hide();

				        swal({
				            type: "error",
				            text: "There has some error, please try again"
				        });
				        console.log("error", JSON.stringify(jqXHR));
				    }
				});*/
			});



		});
	}

	//for bundleb2b
	//replace cart contents with new items
	replaceCart(cartItemArr, itemArr) {
		const cartitem = cartItemArr[cartItemArr.length - 1];
		console.log("delete cartitem...", cartitem);

		this.$overlay_b2b.show();

		utils.api.cart.itemRemove(cartitem.id, (err, response) => {
			if (response.data.status === 'succeed') {
				cartItemArr.pop();

				if (cartItemArr.length > 0) {
					this.replaceCart(cartItemArr, itemArr);
				} else {
					console.log("cart items removed, adding new items");
					this.addProductToCartBundleb2b(itemArr);
				}
			} else {
				this.$overlay_b2b.hide();
				swal({
					text: response.data.errors.join('\n'),
					type: 'error',
				});
			}

		});

	}

	// for bundleb2b
	handlePickListOptions(cartItemObj, cb) {
		const cartItemId = cartItemObj.item_id;
		const product_id = cartItemObj.product_id;
		const variant_id = cartItemObj.variant_id;

		utils.api.productAttributes.configureInCart(cartItemId, {
			template: 'b2b/configure-product-data',
		}, (err, response) => {
			console.log(response.data);

			let selectedPickListOptins = [];

			if (response.data && response.data.options) {
				const options = response.data.options;



				for (let i = 0; i < options.length; i++) {
					const option = options[i];

					if (option.partial == "product-list") {
						const optionValues = option.values;

						for (let j = 0; j < optionValues.length; j++) {
							const optionValue = optionValues[j];

							if (optionValue.selected) {
								selectedPickListOptins.push({
									"option_id": option.id,
									"option_value": optionValue.id,
									"option_data": optionValue.data
								});

							}
						}
					}
				}

				console.log(selectedPickListOptins);
			}

			if (selectedPickListOptins) {
				$.ajax({
					type: "GET",
					url: `${config.apiRootUrl}/productvariants?store_hash=${config.storeHash}&product_id=${product_id}&variant_id=${variant_id}`,
					success: (data) => {
						console.log(data);
						let extras_list = [];


						for (let k = 0; k < selectedPickListOptins.length; k++) {
							let showCustomPrice = true;

							if (data && data.option_list) {
								const options = data.option_list;


								for (let j = 0; j < options.length; j++) {
									const optionId = options[j].option_id;
									const optionValue = options[j].option_value;

									if (optionId == selectedPickListOptins[k].option_id && optionValue == selectedPickListOptins[k].option_value) {
										showCustomPrice = false;


									}



								}

								if (showCustomPrice) {
									const extra_product_id = selectedPickListOptins[k].option_data;
									const extra_variant_id = this.getVariantIdByProductId(extra_product_id);
									if (extra_variant_id) {
										extras_list.push({
											"extra_product_id": extra_product_id,
											"extra_variant_id": extra_variant_id
										});
									} else {
										extras_list.push({
											"extra_product_id": extra_product_id
										});
									}

								}
							}

						}

						if (extras_list) {
							cartItemObj.extras_list = _.cloneDeep(extras_list);
						}

						if (cb) {
							cb();
						}


					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("error", JSON.stringify(jqXHR));
					}
				});
			} else {
				if (cb) {
					cb();
				}

			}


		});

	}

	updateCatalogPrice(cartItemsArr, cartId, responseHtml) {
		const bypass_store_hash = `${config.storeHash}`;
		const cartItemObj = cartItemsArr[cartItemsArr.length - 1];
		delete cartItemObj.option_text;
		console.log("putdata", JSON.stringify(cartItemObj));

		this.handlePickListOptions(cartItemObj, () => {
			console.log("putdata2", JSON.stringify(cartItemObj));
			$.ajax({
				type: "PUT",
				url: `${config.apiRootUrl}/cart?store_hash=${bypass_store_hash}&cart_id=${cartId}`,
				data: JSON.stringify(cartItemObj),
				success: (data) => {
					console.log("update catalog price", data);

					cartItemsArr.pop();
					if (cartItemsArr.length == 0) {
						console.log("update price done.");
						let catalog_priceValue;
						const cartItems = data.data.line_items.physical_items;
						for (let j = 0; j < cartItems.length; j++) {
							const product_id = cartItems[j].product_id;
							if (product_id == $("input[name=product_id]", this.scope).val()) {
								catalog_priceValue = cartItems[j].sale_price;
							}
						}

						// Open preview modal and update content

						if (this.previewModal) {

							//this.updateCartContent(this.previewModal);
							this.getCartContent("", (err, response) => {
								this.$overlay_b2b.hide();

								if (err) {
									console.log(err);
									return swal({
										type: 'error',
										text: 'There has some error, please try again.'
									});
								}


								this.previewModal.open();
								this.previewModal.updateContent(response);
								$("#previewModal").find(".productView").html(responseHtml);
								const productPrice = $("#previewModal").find(".productView .productView-price").text();
								const productPriceArr = productPrice.split(" × ");
								$("#previewModal").find(".productView .productView-price").html(`${productPriceArr[0]} × $${catalog_priceValue}`);

								// Update cart counter
								const $body = $('body');
								const $cartQuantity = $('[data-cart-quantity]', modal.$content);
								const $cartCounter = $('.navUser-action .cart-count');
								const quantity = $cartQuantity.data('cartQuantity') || 0;

								$cartCounter.addClass('cart-count--positive');
								$body.trigger('cart-quantity-update', quantity);
							});
						} else {
							// if no modal, redirect to the cart page
							this.redirectTo(response.data.cart_item.cart_url || this.context.urls.cart);
						}

					} else {
						this.updateCatalogPrice(cartItemsArr, cartId, responseHtml);
					}
				},
				error: (jqXHR, textStatus, errorThrown) => {
					this.$overlay_b2b.hide();
					alert("update catalog price error");
				}
			});
		});



	}

	// for simple products
	getVariantIdByProductId(productId) {
		let variantId;

		if (this.catalog_products && this.catalog_products[productId]) {
			const variantSkus = this.catalog_products[productId];
			variantId = variantSkus[0].variant_id;
		}
		return variantId;
	}

	// TODO 
}