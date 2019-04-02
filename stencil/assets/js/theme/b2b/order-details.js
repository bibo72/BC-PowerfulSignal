import urlUtils from '../common/url-utils';
import Url from 'url';
import utils from '@bigcommerce/stencil-utils';
import _ from 'lodash';
import swal from 'sweetalert2';
import config from './config';
import {
	defaultModal
} from '../global/modal';
import pricesStyle from './prices-style';

export default function(context) {
	const customer = context.customer;
	const store_settings = context.b2bSettings;
	const store_time_zone = store_settings.store_time_zone;
	const store_currency_token = store_settings.money.currency_token;

	const url = Url.parse(window.location.href, true);
	const orderID = url.query["id"] || '';
	if (!orderID) {
		window.location.href = "/account.php?action=order_status";
		return;
	}

	console.log("order Details page");
	//store hash
	const bypass_store_hash = `${config.storeHash}`;
	//login user
	//const bypass_email = "bibo72@outlook.com";
	const bypass_email = customer.email;
	const bypass_customer_id = customer.id;
	let bypass_company_id;

	const gCurrency = "$";
	let gCatalogId;
	let gRoleId = -1;
	let catalog_products = {};

	const $overlay = $("#b2b_loading_overlay");

	// for init date picker, new Date()
	const getStoreZoneDate = function(date) {
		// local date
		const localDate = date || new Date();
		const localTime = localDate.getTime();
		// local offset
		const localOffset = localDate.getTimezoneOffset() * 60000;
		// 8*60*60*1000
		// UTC Time
		const utcTime = localTime + localOffset;
		// store setting time zone
		const time_zone = store_time_zone;
		// store setting time
		const zonetime = utcTime + (3600000 * time_zone);
		// store setting date
		const zoneDate = new Date(zonetime);
		return zoneDate;
	}

	const getFormatDate = function(date, split) {
		let formatDate = "";
		const year = date.getFullYear();
		let month = date.getMonth() + 1;
		month = month > 9 ? month : "0" + month;
		let day = date.getDate() > 9 ? date.getDate() : "0" + date.getDate();

		if (split === "/") {
			formatDate = `${month}/${day}/${year}`;
		} else {
			formatDate = `${year}-${month}-${day}`;
		}
		return formatDate;
	}

	const load_data = function() {
		$overlay.show();

		$.ajax({
			type: "GET",
			url: `${config.apiRootUrl}/orderDetail?store_hash=${bypass_store_hash}&id=${orderID}`,
			success: function(data) {
				console.log("order detail", data);
				$overlay.hide();
				if (data) {

					const order = data;
					const order_id = order.id;
					const order_total = order.total_inc_tax;
					const order_status = order.status;

					//"date_modified": "Wed, 19 Dec 2018 06:22:19 +0000"
					//"date_created": "Wed, 19 Dec 2018 06:22:19 +0000"
					const order_created_date = getStoreZoneDate(new Date(order.date_created));
					const order_modified_date = getStoreZoneDate(new Date(order.date_modified));
					const order_created_date_formatted = getFormatDate(order_created_date, "/");
					const order_modified_date_formatted = getFormatDate(order_modified_date, "/");

					const order_products = order.products || [];

					let isOwn = false;
					if (order.customer_info && order.customer_info.id == bypass_customer_id) {
						isOwn = true;
					}

					$("#heading_order_id").text(order_id);


					let orderItemsHtml = `<h3 class="account-heading">Order Contents</h3><ul class="account-list">`;
					if (data.products) {
						data.products.forEach(function(item, index) {
							const variantSku = item.sku;
							const productId = item.product_id;
							const variantId = getVariantIdByVariantSku(variantSku);

							const trHtml = "";



							let optionHtml = "";
							let optionsArr = [];
							if (item.product_options) {
								optionHtml += `<dl class="definitionList">`;

								item.product_options.forEach(function(op, index) {

									optionsArr.push({
										"option_id": `attribute[${op.product_option_id}]`,
										"option_value": op.value
									});

									optionHtml += `<dt class="definitionList-key">${op.display_name}</dt>
							                       <dd class="definitionList-value">${op.display_value}</dd>`;
								});
								optionHtml += `</dl>`;
							}

							//<div class="account-product-checkItem">
							//    <input class="form-checkbox" type="checkbox" id="account-product-id-${item.id}" value="${item.id}">
							//    <label for="account-product-id-${item.id}" class="form-label">
							//        <span class="is-srOnly">Checkbox ${item.id} label</span>
							//    </label>
							//</div>
							let checkIputHtml = "";
							if (variantId) {
								checkIputHtml = `<div class="account-product-checkItem"> 
				                    <input class="form-checkbox" type="checkbox" id="account-product-id-${variantId}" value="${variantId}" 
				                    data-variant-id="${variantId}" data-product-id="${productId}" data-qty="${item.quantity}" data-options='${JSON.stringify(optionsArr)}'>
				                    <label for="account-product-id-${variantId}" class="form-label">
				                        <span class="is-srOnly">Checkbox ${variantId} label</span>
				                    </label>
					            </div>`;

							} else {
								checkIputHtml = `<div class="account-product-checkItem"></div>`;
							}

							//<h6>${item.brand}</h6>
							let brandHtml = "";
							if (item.brand) {
								//TODO
								brandHtml += `<h6>${item.brand}</h6>`;
							}


							//
							//<dl class="definitionList">
							//        <dt class="definitionList-key">{{lang 'account.orders.gift_wrapping'}}</dt>
							//        <dd class="definitionList-value">{{gift_wrapping_name}}</dd>
							// </dl>

							let giftHtml = "";
							if (item.gift_wrapping_name) {
								//TODO
								giftHtml += `<dl class="definitionList">`;
								item.product_options.forEach(function(op, index) {
									optionHtml += `<dt class="definitionList-key">{{lang 'account.orders.gift_wrapping'}}</dt>
							                       <dd class="definitionList-value">${op.gift_wrapping_name}</dd>`;
								});
								giftHtml += `</dl>`;
							}

							//{{#if event_date}}
							//                    <dl class="definitionList">
							//                        <dt class="definitionList-key">
							//                            {{event_date.name}}:
							//                        </dt>
							//                        <dd class="definitionList-value">
							//                            {{event_date.date}}
							//                        </dd>
							//                    </dl>
							//                {{/if}}
							let eventDateHtml = "";
							if (item.event_date) {
								//TODO
								eventDateHtml += `
								<dl class="definitionList">
                                    <dt class="definitionList-key">${item.event_date.name}</dt>
							        <dd class="definitionList-value">${item.event_date.date}</dd>
								</dl>`;
							}


							orderItemsHtml += `
								<li class="account-listItem">
							        <div class="account-product account-product--alignMiddle">
							            ${checkIputHtml}
							            <figure class="account-product-figure">
							                
							                    <img class="account-product-image"
							                         src="${item.primary_image.thumbnail_url}"
							                         alt="${item.name}"
							                         title="${item.name}">
							            </figure>
							            <div class="account-product-body">
							                <span class="account-product-price">${gCurrency}${pricesStyle(item.base_price, 2)}</span>
							                <h5 class="account-product-title">${item.quantity} &#215; ${item.name}</h5>
							                
							                ${brandHtml}
							                ${optionHtml}
							                ${giftHtml}
							                ${eventDateHtml}
							            </div>
							        </div>
							    </li>`;
						});
					}
					orderItemsHtml += `</ul>`;

					let orderTotalHtml = `<dl class="account-orderTotal">`;
					if (order.subtotal_ex_tax) {
						orderTotalHtml += `<dt class="account-orderTotal-key">Subtotal:</dt>
                        <dd class="account-orderTotal-value">${gCurrency}${pricesStyle(order.subtotal_ex_tax,2)}`;
					}
					if (order.discount_amount && order.discount_amount > 0) {
						orderTotalHtml += `<dt class="account-orderTotal-key">Discount:</dt>
                        <dd class="account-orderTotal-value">${gCurrency}${pricesStyle(order.discount_amount,2)}`;
					}
					if (order.coupons && order.coupons.length > 0) {
						const coupons = order.coupons;
						const couponCode = coupons[0].code;
						const couponAmount = coupons[0].discount;
						orderTotalHtml += `<dt class="account-orderTotal-key">Coupon Code (${couponCode}):</dt>
                        <dd class="account-orderTotal-value">${gCurrency}${pricesStyle(couponAmount,2)}`;
					}
					if (order.shipping_cost_inc_tax && order.shipping_cost_inc_tax > 0) {
						orderTotalHtml += `<dt class="account-orderTotal-key">Shipping:</dt>
                        <dd class="account-orderTotal-value">${gCurrency}${parseFloat(order.shipping_cost_inc_tax)}`;
					}
					if (order.total_tax && order.total_tax > 0) {
						orderTotalHtml += `<dt class="account-orderTotal-key">Tax:</dt>
                        <dd class="account-orderTotal-value">${gCurrency}${pricesStyle(order.total_tax,2)}`;
					}
					if (order.total_inc_tax) {
						orderTotalHtml += `<dt class="account-orderTotal-key">Grand Total:</dt>
                        <dd class="account-orderTotal-value">${gCurrency}${pricesStyle(order.total_inc_tax,2)}`;
					}
					orderTotalHtml += `</dl>`;
					$(".account-content").html(`${orderItemsHtml}${orderTotalHtml}`);

					//account-sidebar
					let sideBarHtml = `
							<section class="account-sidebar-block">
				                <h3 class="account-heading">Order Details</h3>
				                <dl class="definitionList">
				                    <dt class="definitionList-key">Order status:</dt>
				                    <dd class="definitionList-value">${order_status}</dd>
				                    <dt class="definitionList-key">Order date:</dt>
				                    <dd class="definitionList-value">${order_created_date_formatted}</dd>
				                    <dt class="definitionList-key">Order total:</dt>
				                    <dd class="definitionList-value">${gCurrency}${pricesStyle(order_total,2)}</dd>
				                    <dt class="definitionList-key">Payment method:</dt>
				                    <dd class="definitionList-value">${order.payment_method}</dd>
				                </dl>`;
					if (isOwn) {
						sideBarHtml += `<button data-print-invoice="/account.php?action=print_invoice&order_id=${order_id}" class="button">Print Invoice</button>
				            </section>`;
					}

					sideBarHtml += `</section>`;

					let shipping_address;
					if (data.shipping_addresses) {
						if (data.shipping_addresses instanceof Array) {
							const tmpAddress = data.shipping_addresses;
							shipping_address = tmpAddress[0];

						} else {
							shipping_address = data.shipping_addresses;
						}
					}
					if (shipping_address) {
						sideBarHtml += `<section class="account-sidebar-block">
			                    <h3 class="account-heading">Ship To</h3>
			                    <ul class="account-order-address">
			                        <li>${shipping_address.first_name} ${shipping_address.last_name}</li>
			                        <li>${shipping_address.company}</li>
			                        <li>${shipping_address.street_1}</li>
			                        <li>${shipping_address.street_2}</li>
			                        <li>${shipping_address.city}, ${shipping_address.state} ${shipping_address.zip}</li>
			                        <li>${shipping_address.country}</li>
			                    </ul>
			                </section>`;

					}

					if (data.billing_address) {
						sideBarHtml += `
							<section class="account-sidebar-block">
				                <h3 class="account-heading">Bill To</h3>
				                <ul class="account-order-address">
				                    <li>${data.billing_address.first_name} ${data.billing_address.last_name}</li>
			                        <li>${data.billing_address.company}</li>
			                        <li>${data.billing_address.street_1}</li>
			                        <li>${data.billing_address.street_2}</li>
			                        <li>${data.billing_address.city}, ${data.billing_address.state} ${data.billing_address.zip}</li>
			                        <li>${data.billing_address.country}</li>
				                </ul>
				            </section>`;

					}

					sideBarHtml += `<section class="account-sidebar-block">
			                <h3 class="account-heading">Actions</h3>
			                <div class="order-details-info">
			                    
			                    <button reorder-items type="button" class="button">Reorder</button>
			                    <button add-to-shopping-list type="button" class="button">Add to New Shopping List</button>
			                    
			                </div>
			            </section>`;



					$(".account-sidebar").html(sideBarHtml);



				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log("error", JSON.stringify(jqXHR));
			}
		});
	}


	var interval = setInterval(function() {
		if (sessionStorage.getItem("bundleb2b_user")) {
			if (sessionStorage.getItem("bundleb2b_user") == "none") {
				window.location.href = "/";
				return;
			}
			if (sessionStorage.getItem("catalog_products")) {
				catalog_products = JSON.parse(sessionStorage.getItem("catalog_products"));
			}

			gCatalogId = sessionStorage.getItem("catalog_id");

			const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
			gRoleId = bundleb2b_user.role_id;
			bypass_company_id = bundleb2b_user.company_id;

			clearInterval(interval);

			if (gRoleId != "0") {
				load_data();

			} else {
				window.location.href = "/account.php";
			}

		}

	}, 100);


	//bind events
	$("body").on('click', '[data-print-invoice]', (event) => {
		const $target = $(event.target);
		const left = window.screen.availWidth / 2 - 450;
		const top = window.screen.availHeight / 2 - 320;
		const url = $target.data('printInvoice');

		window.open(url, 'orderInvoice', `width=900,height=650,left=${left},top=${top},scrollbars=1`);
	});

	$("body").on('click', '[reorder-items]', (event) => {
		const $target = $(event.target);
		const $checkedItems = $("input.form-checkbox:checked");
		if (!$checkedItems.length) {
			return swal({
				type: "error",
				text: "Please select one or more items to reorder."
			});
		}
		let itemArr = [];
		$checkedItems.each(function(index, item) {
			const $checkbox = $(item);
			const variant_id = $checkbox.attr("data-variant-id");
			const product_id = $checkbox.attr("data-product-id");
			const qty = parseInt($checkbox.attr("data-qty"));
			const options = $checkbox.attr("data-options");
			let options_list = [];
			if (options) {
				options_list = JSON.parse(options);
			}

			itemArr.push({
				"product_id": product_id,
				"variant_id": variant_id,
				"qty": qty,
				"options_list": options_list
			});

		});

		console.log(itemArr);

		let cartItemIDs = [];
		let cartId;

		$.ajax({
			type: "GET",
			url: "../api/storefront/carts",
			contentType: "application/json",
			accept: "application/json",
			async: true,
			success: (data) => {
				if (data && data.length > 0) {
					cartId = data[0].id;
					//cartItemIDs = data[0].lineItems.physicalItems;
					const cartItemIDs_all = data[0].lineItems.physicalItems;
					cartItemIDs = cartItemIDs_all.filter(function(item) {
						return item.parentId == null;
					});
				}

				// Customer Requirements Direct Merger
				$overlay.show();
				addProductToCart(itemArr);
			},
			error: () => {
				$overlay.hide();
				swal({
					type: "error",
					text: "There has some error, please try again."
				});
			}
		});

	});
	$("body").on('click', '[add-to-shopping-list]', (event) => {
		const $target = $(event.target);

		const $checkedItems = $("input.form-checkbox:checked");
		if (!$checkedItems.length) {
			return swal({
				type: "error",
				text: "Please select one or more items."
			});
		}
		openCreateShoppingListModal();

	});

	$("body").on('submit', '#new_shopping_list_form', (event) => {
		event.preventDefault();
		const $form = $(event.target);
		const orderId = $form.attr("data-order-id");
		const list_name = $("#list_name", $form).val();
		const list_comment = $("#list_comment", $form).val() || " ";
		let list_status = "30";
		if (gRoleId == 1 || gRoleId == 2) {
			list_status = "0";
		}
		const $checkedItems = $("input.form-checkbox:checked");
		if (!$checkedItems.length) {
			return swal({
				type: "error",
				text: "Please select one or more items."
			});
		}
		let products_arr = [];
		$checkedItems.each(function(index, item) {
			const $checkbox = $(item);
			const variant_id = $checkbox.attr("data-variant-id");
			const product_id = $checkbox.attr("data-product-id");
			const qty = parseInt($checkbox.attr("data-qty"));
			const options = $checkbox.attr("data-options");
			let options_list = [];
			if (options) {
				options_list = JSON.parse(options);
			}

			products_arr.push({
				"product_id": product_id,
				"variant_id": variant_id,
				"qty": qty,
				"options_list": options_list
			});

		});

		const postData = {
			"store_hash": bypass_store_hash,
			"company_id": bypass_company_id,
			"customer_id": `${bypass_customer_id}`,
			"name": list_name,
			"description": list_comment,
			"products": products_arr,
			"status": list_status
		};
		console.log("add list postData", postData);
		console.log("add list postData", JSON.stringify(postData));
		//return;

		$.ajax({
			type: "POST",
			url: `${config.apiRootUrl}/requisitionlist?customer_id=${bypass_customer_id}`,
			data: JSON.stringify(postData),
			success: function(data) {
				//debugger
				console.log("added shopping list", data);

				if (newListModal) {
					newListModal.close();
				}
				swal({
					text: "Your products have added to new shopping list.",
					type: 'success',
				});
			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log("error", JSON.stringify(jqXHR));
			}
		});
	});


	let newListModal;
	const openCreateShoppingListModal = function() {
		newListModal = defaultModal();
		newListModal.open({
			size: 'small'
		});
		newListModal.updateContent(`
		    <div class="modal-header">
		        <h2 class="modal-header-title">Create Shopping List</h2>
		        <a href="#" class="modal-close" aria-label="close" role="button">
		            <span aria-hidden="true">&#215;</span>
		        </a>
		    </div>
		    <div class="modal-body">
		        <form class="form" id="new_shopping_list_form" action="" method="post">
		            <fieldset class="form-fieldset">
		                <div class="form-field">
		                    <label class="form-label" for="list_name">Shopping List Name
		                        <small>*</small>
		                    </label>
		                    <input class="form-input" type="text" name="list_name" id="list_name">
		                </div>
		                <div class="form-field">
		                	<label class="form-label" for="list_comment">Description</label>
		                	<textarea class="form-input" name="list_comment" id="list_comment" cols="30" rows="3"></textarea>
		                </div>

		                <div class="form-actions">
		                    <input type="submit" class="button button--primary"
		                           value="Save" id="add_new_shoppingList">

		                    <a href="#" class="button  modal-close modal-close--button">Cancel</a>
		                </div>

		            </fieldset>
		        </form>
		    </div>
		`);
	}


	//define functions
	//get variant id by variant sku
	const getVariantIdByVariantSku = function(variantSku) {
		let variantId;
		for (let pid in catalog_products) {
			const variant_item = catalog_products[pid];
			for (let i = 0; i < variant_item.length; i++) {
				const variant_sku = variant_item[i].variant_sku;
				if (variant_sku == variantSku) {
					variantId = variant_item[i].variant_id;
					return variantId;
				}
			}
		}
		return variantId;
	}

	//cart
	// Add item to cart
	const addProductToCart = function(itemArr) {

		const item = itemArr[itemArr.length - 1];
		console.log("add item to cart...", item);

		const formData = new FormData();
		formData.append("action", "add");
		formData.append("product_id", item.product_id);
		formData.append("qty[]", item.qty);

		const options_list = item.options_list || [];
		for (let i = 0; i < options_list.length; i++) {
			formData.append(options_list[i].option_id, options_list[i].option_value);
		}

		for (var inx of formData) {
			console.log(inx);
		}
		//return;
		utils.api.cart.itemAdd(formData, (err, response) => {
			const errorMessage = err || response.data.error;

			// Guard statement
			if (errorMessage) {
				// Strip the HTML from the error message
				const tmp = document.createElement('DIV');
				tmp.innerHTML = errorMessage;
				$overlay.hide();

				return swal({
					text: tmp.textContent || tmp.innerText,
					type: 'error',
				});
			}

			itemArr.pop();
			if (itemArr.length > 0) {
				addProductToCart(itemArr);
			} else {

				console.log("add item to cart done.");

				const options = {
					template: {
						content: 'b2b/cart-content-data',
						totals: 'cart/totals',
						pageTitle: 'cart/page-title',
						statusMessages: 'cart/status-messages',
					},
				};
				utils.api.cart.getContent(options, (err, response) => {
					if (err) {
						$overlay.hide();
						return swal({
							text: "There are errors when getting cart content, please try again.",
							type: 'error',
						});
					}
					//console.log(response.content);
					const divEle = document.createElement("div");
					$(divEle).html(response.content);
					const $items = $(divEle).find(".item");
					if ($items.length > 0) {

						let cartItemsArr = [];
						let cartItemsObj = {};
						let cartQuantity = 0;

						$.each($items, (index, item) => {
							//console.log(item);
							const $cartItem = $(item);
							const itemId = $cartItem.attr("data-item-id");
							const itemSku = $cartItem.attr("data-item-sku");
							const itemProductId = $cartItem.attr("data-item-productId");
							const itemQty = parseInt($cartItem.attr("data-item-quantity"));
							const itemOptions = $cartItem.attr("data-item-options");

							let itemVariantId;
							const variants = catalog_products[itemProductId];
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

						$overlay.hide();

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
						updateCatalogPrice(cartItemsArr, cartId);
					}

				});
			}
		});
	}

	//replace cart contents with new items
	const replaceCart = function(cartItemArr, itemArr) {
		const cartitem = cartItemArr[cartItemArr.length - 1];
		console.log("delete cartitem...", cartitem);

		$overlay.show();


		utils.api.cart.itemRemove(cartitem.id, (err, response) => {
			if (err) {
				return swal({
					text: "There are errors when replacing cart irems, please try again.",
					type: 'error',
				});
			}

			if (response.data && response.data.status === 'succeed') {
				cartItemArr.pop();

				if (cartItemArr.length > 0) {
					replaceCart(cartItemArr, itemArr);
				} else {
					console.log("cart items removed, adding new items");
					addProductToCart(itemArr);
				}
			} else {
				$overlay.hide();
				swal({
					text: response.data.errors.join('\n'),
					type: 'error',
				});
			}

		});

	}

	// for simple products
	const getVariantIdByProductId = function(productId) {
		let variantId;

		if (catalog_products && catalog_products[productId]) {
			const variantSkus = catalog_products[productId];
			variantId = variantSkus[0].variant_id;
		}
		return variantId;
	}

	const handlePickListOptions = function(cartItemObj, cb) {
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
									const extra_variant_id = getVariantIdByProductId(extra_product_id);
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

	const updateCatalogPrice = function(cartItemsArr, cartId) {
		const cartItemObj = cartItemsArr[cartItemsArr.length - 1];
		delete cartItemObj.option_text;
		console.log("putdata", JSON.stringify(cartItemObj));

		handlePickListOptions(cartItemObj, () => {
			console.log("putdata2", JSON.stringify(cartItemObj));

			$.ajax({
				type: "PUT",
				url: `${config.apiRootUrl}/cart?store_hash=${bypass_store_hash}&cart_id=${cartId}`,
				data: JSON.stringify(cartItemObj),
				success: function(data) {
					console.log("update catalog price...", data);

					cartItemsArr.pop();
					if (cartItemsArr.length == 0) {
						console.log("update price done.");
						$overlay.hide();



						swal({
							text: "Your list items have been added to cart",
							type: 'success'
						});

						//window.location.reload();

					} else {
						updateCatalogPrice(cartItemsArr, cartId);
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					$overlay.hide();
					alert("update catalog price error");
				}
			});
		});

	}



}


/*$.ajax({
	type: "GET",
	url: `${config.apiRootUrl}/company?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`,
	success: function(data) {
		console.log("list users", data);
	},
	error: function(jqXHR, textStatus, errorThrown) {
		$overlay.hide();
		console.log("error", JSON.stringify(jqXHR));
	}
});*/
