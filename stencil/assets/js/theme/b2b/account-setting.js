import urlUtils from '../common/url-utils';
import Url from 'url';
import utils from '@bigcommerce/stencil-utils';
import _ from 'lodash';
import swal from 'sweetalert2';
import config from './config';
import {
	defaultModal
} from '../global/modal';


export default function(customer) {
	console.log("account setting page");

	// non-b2b user
	if (!sessionStorage.getItem("bundleb2b_user") || sessionStorage.getItem("bundleb2b_user") == "none") {
		return;
	}

	// b2b user
	const gRoleDefine = {
		"0": "Junior Buyer",
		"1": "Admin",
		"2": "Senior Buyer",
		"10": "Sale Representative"
	};

	const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
	let gCompanyName = bundleb2b_user.company_name || "";
	const gRoleId = bundleb2b_user.role_id;
	if (sessionStorage.getItem("bundleb2b_sale")) {
		const bundleb2b_sale = JSON.parse(sessionStorage.getItem("bundleb2b_sale"));
		gCompanyName = bundleb2b_sale.company_name || "";
	}

	const $accountForm = $(".form[data-edit-account-form]");
	$accountForm.addClass("b2b-account-setting-form").prepend(`<div class="form-field b2b-account-form-heading" >Account Information</div>`);

	const $accountEmail = $accountForm.find('[data-field-type="EmailAddress"]').parents(".form-field");
	const $accountPhone = $accountForm.find('input#account_phone').parents('.form-field');
	const $accountCompany = $accountForm.find('input#account_companyname').parents(".form-field");
	const $accountPassword = $accountForm.find('[data-field-type="Password"]').parents(".form-field");

	const $accountBilling = $accountForm.find('[data-label="Billing Phone Number"]').parents(".form-field");

	if ($accountPhone.length > 0) {
		$accountPhone.addClass("form-field--right");
	}
	if ($accountCompany.length > 0) {
		$accountCompany.hide();
	}
	if ($accountPassword.length > 0) {
		$('<div class="form-field b2b-account-form-heading" >Password Reset</div>').insertBefore($accountPassword);
	}
	if ($accountEmail.length > 0) {
		$accountBilling.insertAfter($accountEmail);

		$(`<div class="form-field form-field--input form-field--inputText">
                <label class="form-label">
                    Company Name
                </label>
                <input type="text" class="form-input" value="${gCompanyName}" disabled>
            </div>
            <div class="form-field form-field--input form-field--inputText">
                <label class="form-label">
                    Role
                </label>
                <input type="text" class="form-input" value="${gRoleDefine[gRoleId]}" disabled>
            </div>`).insertAfter($accountEmail);
	}

	const getCatalogProducts = function(catalog_id, _callback) {
		//get catalog products
		$.ajax({
			type: "GET",
			url: `${config.apiRootUrl}/catalogproducts?id=${catalog_id}`,
			success: function(data) {
				console.log("get catalog products", data);

				if (data) {
					if (data.length > 0) {
						//const categories = data.categories;
						const products = data;

						let catalogProductsArr = [];
						let catalog_products = {};

						for (var j = 0; j < products.length; j++) {
							const product = products[j];

							catalogProductsArr.push(product.product_id);
							//catalog_products[product.product_id] = product.tier_price;
							//catalog_products[product.product_id] = product;

							if (catalog_products[product.product_id]) {
								catalog_products[product.product_id].push(product);

							} else {
								catalog_products[product.product_id] = [];
								catalog_products[product.product_id].push(product);
							}
							/*let catalog_price = product.price;

							if (product.tier_price && product.tier_price.length > 0) {
							  for (let k = 0; k < product.tier_price.length; k++) {
							    const priceItem = product.tier_price[k];
							    if (priceItem.qty == "1") {
							      catalog_price = priceItem.price;
							    }
							  }
							}
							catalog_products[product.product_id] = catalog_price;*/

						}

						console.log("catalog products", catalog_products);
						sessionStorage.setItem("catalog_products", JSON.stringify(catalog_products));


					}

					if (_callback) {
						_callback();
					}
				}


			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("error", JSON.stringify(jqXHR));
			}
		});

	}

	if (sessionStorage.getItem("catalog_id")) {
		const catalog_id = sessionStorage.getItem("catalog_id");
		getCatalogProducts(catalog_id);
	}
}