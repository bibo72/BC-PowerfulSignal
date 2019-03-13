import urlUtils from '../common/url-utils';
import Url from 'url';
import utils from '@bigcommerce/stencil-utils';
import _ from 'lodash';
import swal from 'sweetalert2';
import config from './config';
import {
	defaultModal
} from '../global/modal';
import './tools/jquery-ui.min.js';
import './tools/jqPaginator.js';
import pricesStyle from './prices-style';

export default function(context) {

	const customer = context.customer;
	const store_settings = context.b2bSettings;
	const store_time_zone = store_settings.store_time_zone;
	const store_currency_token = store_settings.money.currency_token;

	console.log("order lists page");
	//store hash
	const bypass_store_hash = `${config.storeHash}`;
	//login user
	//const bypass_email = "bibo72@outlook.com";
	const bypass_email = customer.email;
	const bypass_customer_id = customer.id;
	let bypass_company_id;

	let gRoleId = -1;
	let catalog_products = {};
	let gCatalogId;
	let gIsShowOwn = false;


	let $overlay; //$ele
	let gOrderData = []; //[]
	//gOrderProducts sample
	//{
	//	"198": [
	//	    {"product_id": ,
	//	     "variant_id": ,
	//	     "qty": ,
	//	     "options_list": 
	//      }
	//	]
	//}
	let gOrderProducts = {};
	let gOrderImages = {}; //{}
	let $orderListsTbody; //$ele
	let orderPerPage = 10; //num

	const initPage = function() {
		$("body").append(`<div class="b2b-loading-overlay" id="b2b_loading_overlay">
			<img src="data:image/gif;base64,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lxogusTFxoq8wMrLsCLHz9C6yczU1Zgn0dnapdPW3t7D2+Ljht3f58sKD+Ts4+bo8L4G7fTZ7/H4rgOj9f3F9/kCbirgr2AugAITWmpgsKEqhAoj2tngsKIpiBITarDIEVLGj5c6ikQGsqSkASNTljNZkqLKl6tYgmQIUyVGmecI1kx5E6e1fTt5+ow4IqjQoQLVGR3ZE6mycEs7NnXqy1lUkVOpwpp3FavWcwOgduWY9aumAAgkjGVqVlkEAkP/RK09aikGgbt48+odgqCv37+ARRwYTLiwYRAJEitezDjE3MeQI0ueTLmy5cuYM2vezLmz58+gQ4seTbq06dOoU6tezbq169ewY8ueTbu27du4c+vezbu379/AgwsfTry48ePIkytfzry58+fQo0ufTr269evYs2vfzr279+/gw4sfT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEM1Ro4YUYZqhhgHV06OGHIIYoIocilmiihySeqOKHRaS44ootAvjijDH+N+OLNfp344ouuLijiEn4+COIQco4ZIlF2ngk/5BCLlkHDk0uuUWUR05ppJMfWqkklh5qqSOXHjJB5ZA9jPljmVeCieaWapq5IxBu3ghnmlzOyWadcc4IRp4vysDnin7SiWWgdw76p4poHHpiDoqayKigTj5aaKSNlghFpSKmgGmImkK6ZKeTfropiDCM+mGpnh6JaqiqmuphG652eEOsdcya6pC2soorrU/Q2oKvwN7646/C7qgErUIgq2yxNybL7IxY0LqDtNQ++2IZtHqQ7bbWrqhttypiQCsE45YL7onknmviBLRe0O676pbobrwi1kJviAKCiWKARehLg4BH6HuEgDLoS+h/LehLLIAMBMFlEAwMmAaXaRBYgDcLTrqg04BNONnEgVocqUWCKfwIKoJN9LsiDR8zuAALDpdoAwsLQMiAEjLosEQdS+gghxIRJxgIACH5BAUKAHcALFoA7gAUAYUAAAf/gHeCg4SFhoeIiYqLjI2Oj5CRkpOIDACUmJmam5ydnp+gnxYBDhyhp6ipqqusrYQVdrEoHa61tre4uZ0Xsb0BRhS6wsPExawADr3KChOXxs/Q0dKIJcrWdhsr09vc3bYPCtfXJhbe5ufomRDi4gEiAunx8vODCQHs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" alt="">
		</div>`);
		$(".account").addClass("b2b-wrap order-lists-wrap").removeClass("account--fixed");
		if (gRoleId == "0") {
			$(".account-content").empty().show().append(`
	    	<h3 class="account-heading">Orders</h3>
	    	<div class="filter-by-date">From:
				<input type="text" id="orderFromDate" readOnly /> To:
				<input type="text" id="orderToDate" readOnly />
				<a style="display:none;" class="button button--primary button--small" href="javascript:void(0);" data-search-date>Search</a></div>
		`);

		} else if (gRoleId == "1" || gRoleId == "2" || gRoleId == "10") {
			$(".account-content").empty().show().append(`
			<div class="table-toolbar top">
	    		<div class="action-links">
	    			<a class="action-link button button--small" href="javascript:void(0);" filter-user data-user-value="0" style="display:none;">Show All Company Orders</a>
	    			<a class="action-link button button--small" href="javascript:void(0);" filter-user data-user-value="1">Show My Orders</a>
	    		</div>
	    	</div>
	    	<h3 class="account-heading">Orders</h3>
	    	<div class="filter-by-date">From:
				<input type="text" id="orderFromDate" readOnly /> To:
				<input type="text" id="orderToDate" readOnly />
				<a style="display:none;" class="button button--primary button--small" href="javascript:void(0);" data-search-date>Search</a></div>
		`);

		}


		$('.account-content').append(`<div class="table-wrap">
            <table class="order-lists-table">
                <thead>
                    <tr>
                        <th></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="id">Order Number<span class="filter-icon"></span></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="total_inc_tax">Product Total<span class="filter-icon"></span></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="date_created">Order Placed<span class="filter-icon"></span></th>
                        <th class="t-align-c">Last Updated</th>
                        <th class="t-align-c">Created By</th>
                        <th class="t-align-c">Status</th>
                        <th class="t-align-c">Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            </div>`);
		$(".table-wrap").after(`<div class="pagination">
		<ul class="pagination-list" id="jqPagination"></ul>
		</div>`);

		$overlay = $("#b2b_loading_overlay");
		$orderListsTbody = $('.order-lists-table tbody');

	}


	const initDatePicker = function() {
		const getDateDay = function(dtMax) {
			var dd = dtMax.getDate();
			var mm = dtMax.getMonth() + 1;
			var y = dtMax.getFullYear();
			return mm + '/' + dd + '/' + y;
		}


		let defaultStartDate = getStoreZoneDate();
		let defaultEndDate = getStoreZoneDate();
		let startMinDate = getStoreZoneDate();
		defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
		startMinDate.setMonth(startMinDate.getMonth() - 12);


		var start = $("#orderFromDate");
		var end = $("#orderToDate");
		start.datepicker({
			maxDate: defaultEndDate,
			//minDate: startMinDate,
			onSelect: function(selected) {
				var dtMax = new Date(selected);
				var dtMin = new Date(selected);
				var dtMaxDate = getDateDay(dtMax);
				var dtMinDate = getDateDay(dtMin);
				dtMin.setDate(dtMin.getDate());
				dtMax.setMonth(dtMax.getMonth() + 12);

				var now = getStoreZoneDate();
				var now_date = getDateDay(now);
				var date_n = new Date(now_date);

				var maxDate = dtMax;
				var minDate = dtMin;

				if (dtMax.getTime() >= date_n.getTime()) {
					maxDate = date_n;
				}
				if (dtMin.getTime() >= date_n.getTime()) {
					minDate = date_n;
				}

				end.datepicker(
					"option", "maxDate", maxDate
				);
				end.datepicker(
					"option", "minDate", minDate
				);

				if (end.val() && start.val()) {
					load_table();
				}
			}
		});
		start.datepicker('setDate', defaultStartDate);

		end.datepicker({
			maxDate: defaultEndDate,
			minDate: defaultStartDate,
			onSelect: function(selected) {
				var dtMax = new Date(selected);
				var dtMin = new Date(selected);
				var dtMaxDate = getDateDay(dtMax);
				var dtMinDate = getDateDay(dtMin);
				dtMin.setMonth(dtMax.getMonth() - 12);
				dtMax.setMonth(dtMax.getMonth());

				var now = getStoreZoneDate();
				var now_date = getDateDay(now);
				var date_n = new Date(now_date);

				var maxDate = dtMax;
				var minDate = dtMin;

				if (dtMax.getTime() >= date_n.getTime()) {
					maxDate = now_date;
				}
				if (dtMin.getTime() >= date_n.getTime()) {
					minDate = now_date;
				}

				/*start.datepicker(
					"option", "maxDate", maxDate
				);
				start.datepicker(
					"option", "minDate", minDate
				);*/

				if (end.val() && start.val()) {
					load_table();
				}
			}
		});
		end.datepicker('setDate', defaultEndDate);
	};

	// get utc time
	const getGMTDate = function() {
		// local date
		const localDate = new Date();
		const localTime = localDate.getTime();
		// local offset
		const localOffset = localDate.getTimezoneOffset() * 60000;
		// 8*60*60*1000
		// UTC Time
		const utcTime = localTime + localOffset;

		// store setting date
		const utcDate = new Date(utcTime);
		return utcDate;
	}

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

	// for date picker search
	// date - 03/06/2019 - mm/dd/yyyy
	const getUtcTime = function(date) {
		const dateArr = date.split("/");
		const localDate = getStoreZoneDate();
		localDate.setFullYear(dateArr[2]);
		localDate.setMonth(parseInt(dateArr[0]) - 1);
		localDate.setDate(dateArr[1]);

		// store setting time zone
		const time_zone = store_time_zone;
		const localTime = localDate.getTime();
		const offset = time_zone * 3600000;
		const utcTime = localTime - offset;

		const utcDate = new Date(utcTime);
		const utcDate_month = utcDate.getMonth() + 1;
		const utcDateString = utcDate.getFullYear() + "-" + utcDate_month + "-" + utcDate.getDate();
		return utcDateString;
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


	const getStoreSettingTimeByUtc = function(date) {
		const dateArr = date.split("/"); //03/06/2019 - mm/dd/yyyy
		const localDate = new Date();
		localDate.setFullYear(dateArr[2]);
		localDate.setMonth(dateArr[0]);
		localDate.setDate(dateArr[1]);

		const len = localDate.getTime();
		const offset = localDate.getTimezoneOffset() * 60000;
		const utcTime = len + offset;

		//store_time_zone*3600000

		const utcDate = new Date(utcTime + store_time_zone * 3600000);
		const utcDateString = utcDate.getMonth() + "/" + utcDate.getDate() + "/" + utcDate.getFullYear();
		return utcDateString;
	}

	const getProductsInfo = function() {
		const $trs = $(".order-lists-table tbody tr");
		$trs.each(function() {
			const $tr = $(this);
			const order_id = $tr.attr("data-order-id");

			if (gOrderImages[order_id]) {
				//get product info form gOrderImages & gOrderProducts
				$tr.find(".col-thumbnail img").attr("src", gOrderImages[order_id]);

				if (gOrderProducts[order_id] && gOrderProducts[order_id].length > 0) {
					if (gRoleId == "1" || gRoleId == "2" || gRoleId == "10") {
						$tr.find(".actions-field .reorder-button").removeAttr("disabled").attr("reorder-items", "true");
					}
					$tr.find(".actions-field .shoppinglist-button").removeAttr("disabled").attr("add-to-shopping-list", "true");
				}


			} else {
				//get order image and products
				const OrderId = order_id;

				$.ajax({
					type: "GET",
					url: `${config.apiRootUrl}/ordersProducts?store_hash=${bypass_store_hash}&order_id=${OrderId}&isImages=1`,
					success: function(data) {
						if (data && data.length > 0) {
							const order_products = data;
							if (order_products && order_products.length > 0) {
								let productArr = [];
								let isBelongToCatalog = true;
								for (let j = 0; j < order_products.length; j++) {
									const product = order_products[j];
									const product_id = product.product_id;
									const product_qty = product.quantity;
									const variant_sku = product.sku;
									const variant_id = getVariantIdByVariantSku(variant_sku);
									if (!variant_id) {
										isBelongToCatalog = false;
									}

									let product_option_list = [];
									if (product.product_options) {
										product.product_options.forEach(function(item, index) {
											product_option_list.push({
												"option_id": `attribute[${item.product_option_id}]`,
												"option_value": item.value
											});
										});
									}

									productArr.push({
										"product_id": product_id,
										"variant_id": variant_id,
										"qty": product_qty,
										"options_list": product_option_list
									});

									if (j == 0) {
										gOrderImages[OrderId] = (product.primary_image && product.primary_image.thumbnail_url) ? product.primary_image.thumbnail_url : "data:image/gif;base64,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";
										$tr.find(".col-thumbnail img").attr("src", gOrderImages[OrderId]);

									}
								}

								if (isBelongToCatalog) {

									gOrderProducts[order_id] = productArr;
									if (gRoleId == "1" || gRoleId == "2" || gRoleId == "10") {
										$tr.find(".actions-field .reorder-button").removeAttr("disabled").attr("reorder-items", "true");
									}
									$tr.find(".actions-field .shoppinglist-button").removeAttr("disabled").attr("add-to-shopping-list", "true");;

								} else {
									gOrderProducts[order_id] = [];
								}

							}

						}


						//gOrderImages[OrderId] = (data && data.thumbnail_url) ? data.thumbnail_url : "data:image/gif;base64,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";
						//$(`tr[data-order-id="${OrderId}"]`).find(".col-thumbnail img").attr("src", gOrderImages[OrderId]);

					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("error", JSON.stringify(jqXHR));
					}
				});
			}
		});

	}

	const renderTable = function(start, end) {

		$orderListsTbody.empty();
		//for (let i = 0; i < data.length; i++) {
		for (let i = start; i < end; i++) {
			//const order = data[i];
			const order = gOrderData[i];
			const order_id = order.id;
			const order_total = order.total_inc_tax;
			const order_status = order.status;

			//"date_modified": "Wed, 19 Dec 2018 06:22:19 +0000"
			//"date_created": "2018-12-19 06:22:19"
			let order_created_date_utc = order.date_created + " +0000";
			order_created_date_utc = order_created_date_utc.replace(/-/g, "/");
			const order_created_date = getStoreZoneDate(new Date(order_created_date_utc));
			const order_created_date_formatted = getFormatDate(order_created_date, "/");

			const order_modified_date = getStoreZoneDate(new Date(order.date_modified));
			const order_modified_date_formatted = getFormatDate(order_modified_date, "/");


			let createdBy_first_name = "";
			let createdBy_last_name = "";
			if (order.customer_info) {
				createdBy_first_name = order.customer_info.first_name;
				createdBy_last_name = order.customer_info.last_name;
			}

			let imageThumbail = "";
			if (gOrderImages[order_id]) {
				imageThumbail = gOrderImages[order_id];
			}

			//const order_products = order.products || [];
			let isBelongToCatalog = false;
			if (gOrderProducts[order_id] && gOrderProducts[order_id].length > 0) {
				isBelongToCatalog = true;
			}

			//handle products, used for shopping list and reorder
			/*let orderImageId;
			let isBelongToCatalog = true;
			if (order_products && order_products.length > 0) {
				let productArr = [];
				for (let j = 0; j < order_products.length; j++) {
					const product = order_products[j];
					const variant_sku = product.sku;
					const variant_id = getVariantIdByVariantSku(variant_sku);
					if (!variant_id) {
						isBelongToCatalog = false;
					}

					let product_option_list = [];
					if (product.product_options) {
						product.product_options.forEach(function(item, index) {
							product_option_list.push({
								"option_id": `attribute[${item.product_option_id}]`,
								"option_value": item.value
							});
						});
					}

					productArr.push({
						"product_id": product.product_id,
						"variant_id": variant_id,
						"qty": product.quantity,
						"options_list": product_option_list
					});

					if (j == 0) {
						orderImageId = product.product_id;
					}
				}

				if (isBelongToCatalog) {
					if (!gOrderProducts[order_id]) {
						gOrderProducts[order_id] = productArr;
					}
				}

			}*/


			/*const tr = `
							<tr data-order-id="${order_id}">
	                        <td class="col-thumbnail"><img src="${imageThumbail}" alt=""></td>
	                        <td class="t-align-c"><a href="/account.php?action=view_order&order_id=${order_id}">#${order_id}</a></td>
	                        <td class="t-align-c">$${parseFloat(order_total).toFixed(2)}</td>
	                        <td class="t-align-c">${order_created_date_formatted}</td>
	                        <td class="t-align-c">${order_modified_date_formatted}</td>
	                        <td class="t-align-c">${createdBy_first_name} ${createdBy_last_name}</td>
	                        <td class=" t-align-c"><span class="account-orderStatus-label order-status-text">${order_status}</span></td>
	                        <td class="actions-field t-align-r">
	                            <a href="#" class="button button--primary button--small" reorder-items>Reorder</a>
	                            <div class="dropdown-wrap">
	                                <a aria-controls="shoppinglist-dropdown-${order_id}" aria-expanded="true" class="button dropdown-menu-button button--small" data-dropdown="shoppinglist-dropdown-${order_id}">
					                    <span>Add to Shopping List</span>
					                    <i aria-hidden="true" class="icon">
					                        <svg>
					                            <use xlink:href="#icon-chevron-down"></use>
					                        </svg>
					                    </i>
					                </a>
					                <ul aria-hidden="false" class="dropdown-menu" data-dropdown-content="" id="shoppinglist-dropdown-${order_id}" tabindex="-1">
						                <li><a href="#" class="button" add-to-new-list>Add to New Shopping List</a></li>
					                </ul>
	                                
	                            </div>
	                            
	                        </td>
	                    </tr>`;*/



			let tr = `
							<tr data-order-id="${order_id}">
	                        <td class="col-thumbnail"><img src="${imageThumbail}" alt=""></td>
	                        <td class="t-align-c"><a href="/orderdetail/?id=${order_id}">#${order_id}</a></td>
	                        <td class="t-align-c">$${pricesStyle(order_total, 2)}</td>
	                        <td class="t-align-c">${order_created_date_formatted}</td>
	                        <td class="t-align-c">${order_modified_date_formatted}</td>
	                        <td class="t-align-c">${createdBy_first_name} ${createdBy_last_name}</td>
	                        <td class=" t-align-c"><span class="account-orderStatus-label order-status-text">${order_status}</span></td>
	                        <td class="actions-field t-align-r">`;
			if (isBelongToCatalog) {
				tr += `
	                            <a href="javascript:void(0);" class="reorder-button button button--primary button--small" disabled>Reorder</a>
	                            <a href="javascript:void(0);" class="shoppinglist-button button button--small" disabled>Add to New Shopping List</a> 
	                        </td>
	                    </tr>`;

			} else {
				tr += `
	                            <a href="javascript:void(0);" class="reorder-button button button--primary button--small" disabled>Reorder</a>
	                            <a href="javascript:void(0);" class="shoppinglist-button button button--small" disabled>Add to New Shopping List</a> 
	                        </td>
	                    </tr>`;
			}


			$orderListsTbody.append(tr);
		}

		var pInterval = setInterval(function() {
			if (sessionStorage.getItem("catalog_products")) {
				clearInterval(pInterval);
				catalog_products = JSON.parse(sessionStorage.getItem("catalog_products"));
				getProductsInfo();
			}
		}, 100);

	}

	// sort: Object 
	// -- name
	// -- value
	// sort_filter_name
	const load_table = function(sort) {
		$overlay.show();
		let url = `${config.apiRootUrl}/listOrders?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`;
		if (gRoleId == "10") {
			url += `&company_id=${bypass_company_id}`
		}
		if (gIsShowOwn) {
			url += `&is_show_my_orders=1`;
		}
		if (sort && (typeof sort == 'object')) {
			url += `&sort_field=${sort.name}&sort_value=${sort.value}`;
		}

		var $start = $("#orderFromDate");
		var $end = $("#orderToDate");
		if ($start.length && $end.length && $start.val() && $end.val()) {
			/*const startDateArr = $start.val().split("/"); //12/02/2018
			const startDate = `${startDateArr[2]}-${startDateArr[0]}-${startDateArr[1]}`; //2018-12-02

			const endDateArr = $end.val().split("/"); //12/02/2018
			const endDate = `${endDateArr[2]}-${endDateArr[0]}-${endDateArr[1]}`; //2018-12-02

			url += `&begin_date=${startDate.trim()}&end_date=${endDate.trim()}`;*/
			//url += `&begin_date=2018-12-01&end_date=2018-12-19`;

			const utcStartDate = getUtcTime($start.val());
			const utcEndDate = getUtcTime($end.val());
			url += `&begin_date=${utcStartDate.trim()}&end_date=${utcEndDate.trim()}`;
		}

		$.ajax({
			type: "GET",
			url: url,
			success: function(data) {
				console.log("list orders", data);
				$overlay.hide();

				if (gIsShowOwn) {
					$('[data-user-value="0"]').show().siblings().hide();
				} else {
					$('[data-user-value="1"]').show().siblings().hide();
				}

				if (sort && (typeof sort == 'object')) {
					const $cth = $(`[data-sort-filter="${sort.name}"]`);
					$cth.siblings('[data-sort-filter]').removeClass("asc");
					if (sort.value == "asc") {
						$cth.addClass("asc");
					} else {
						$cth.removeClass("asc");
					}
				}

				if (data) {
					gOrderData = data;

					const orderNum = data.length;
					const totalPage = Math.ceil(orderNum / orderPerPage);

					if (orderNum > orderPerPage) {
						$("#jqPagination").jqPaginator({
							totalPages: totalPage,
							visiblePages: 10,
							currentPage: 1,
							onPageChange: function(num, type) {

								const start = (num - 1) * orderPerPage;
								const end = (num * orderPerPage > orderNum) ? orderNum : num * orderPerPage;
								renderTable(start, end);
							}
						});
					} else {

						renderTable(0, orderNum);
						//$("#jqPagination").jqPaginator('destroy');
						$("#jqPagination").html("");
					}
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				$orderListsTbody.empty();
				console.log("error", JSON.stringify(jqXHR));
			}
		});


	}

	/*var interval = setInterval(function() {
		if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
			clearInterval(interval);
			gCatalogId = sessionStorage.getItem("catalog_id");

			const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
			gRoleId = bundleb2b_user.role_id;
			bypass_company_id = bundleb2b_user.company_id;


			if (gRoleId == "1" || gRoleId == "2") {
				initPage();
				initDatePicker();
				load_table();

			} else {
				$(".account-content").show();

			}
		}
	}, 100);*/
	const initPageByRole = function() {
		if (gRoleId != "-1") {
			initPage();
			initDatePicker();
			load_table();

		} else {
			$(".account-content").show();
		}
	}

	if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
		const b2bUserInfo = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
		gRoleId = b2bUserInfo.role_id;
		bypass_company_id = b2bUserInfo.company_id;
		if (b2bUserInfo.catalog_id) {
			gCatalogId = b2bUserInfo.catalog_id;
		}
		if (sessionStorage.getItem("catalog_id")) {
			gCatalogId = sessionStorage.getItem("catalog_id");
		}

		if (!b2bUserInfo.company_id && gRoleId == 10) {
			console.log("no company id");
			$(".body").css("visibility", "hidden");
			//window.location.href = "/salerep/";
			const hurl = document.referrer;
			if (hurl.indexOf("/login.php") != -1) {
				$(".body").remove();
				window.location.href = "/salerep/";
			} else {
				return swal({
					allowOutsideClick: false,
					type: "info",
					text: 'Please choose a company on "Dashboard".'
				}).then(() => {
					window.location.href = "/salerep/";
				});
			}

		}

		initPageByRole();

	} else {
		$.ajax({
			type: "GET",
			url: `${config.apiRootUrl}/company?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`,
			success: function(data) {
				console.log("get company users:", data);
				let company_status;
				if (data && JSON.stringify(data) != "{}") {
					company_status = data.company_status;
				}

				if (company_status && company_status == "APPROVED") {
					const userList = data.customers;
					const company_id = data.id;
					const catalog_id = data.catalog_id;
					let role_id = "";

					for (let i = 0; i < userList.length; i++) {
						if (userList[i].id == bypass_customer_id) {
							role_id = userList[i].role;
						}
					}

					gRoleId = role_id;
					bypass_company_id = company_id;
					gCatalogId = catalog_id;

					initPageByRole();
				} else {
					$(".account-content").show();
				}

			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("error", JSON.stringify(jqXHR));
			}
		});

	}



	//bind event
	// search by date range
	$("body").on('click', '[data-search-date]', (event) => {
		var start = $("#orderFromDate");
		var end = $("#orderToDate");
		if (end.val() && start.val()) {
			load_table();
		}

	});

	//user switch
	$("body").on("click", '[filter-user]', (event) => {
		event.preventDefault();
		const $target = $(event.target);

		//$target.hide().siblings("[filter-user]").show();
		const user_value = $target.attr("data-user-value");

		if (user_value == "1") {
			gIsShowOwn = true;
		} else {
			gIsShowOwn = false;
		}
		load_table();
	});

	$("body").on('click', '[data-sort-th]', (event) => {
		event.preventDefault();
		const $target = $(event.target);
		const sort_filter_name = $target.attr("data-sort-filter");
		//$target.toggleClass("asc");
		let sort = {
			"name": sort_filter_name
		};
		if ($target.hasClass("asc")) {
			sort.value = "desc";
			load_table(sort);
		} else {
			sort.value = "asc";
			load_table(sort);
		}

	});


	$("body").on('click', '[add-to-new-list]', (event) => {
		const $target = $(event.target);
		const $tr = $target.parents("tr");
		const orderId = $tr.attr("data-order-id");
		openCreateShoppingListModal(orderId);

	});

	$("body").on('click', '[add-to-shopping-list]', (event) => {
		event.preventDefault();
		const $target = $(event.target);
		const $tr = $target.parents("tr");
		const orderId = $tr.attr("data-order-id");

		if (!gOrderProducts || !gOrderProducts[orderId]) {
			return swal({
				type: "error",
				text: "Some products in the order are no longer available."
			});
		}
		openCreateShoppingListModal(orderId);
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

		let products_arr = [];

		if (gOrderProducts && gOrderProducts[orderId] && gOrderProducts[orderId].length > 0) {
			products_arr = gOrderProducts[orderId];
		} else {
			return swal({
				type: "error",
				text: "Some products in the order are no longer available."
			});
		}

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

	$("body").on("click", '[reorder-items]', (event) => {
		debugger

		event.preventDefault();
		const $target = $(event.target);
		const $tr = $target.parents("tr");
		const orderId = $tr.attr("data-order-id");

		let itemArr = [];

		if (gOrderProducts && gOrderProducts[orderId] && gOrderProducts[orderId].length > 0) {
			itemArr = gOrderProducts[orderId].slice(0);
		} else {
			return swal({
				type: "error",
				text: "Some products in the order are no longer available."
			});
		}
		console.log(itemArr);

		$overlay.show();

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

				console.log("number of items in cart: ", cartItemIDs.length);

				if (cartItemIDs.length > 0) { //if there are items in cart notify user
					$overlay.hide();
					swal({
						title: "The shopping cart isn't empty",
						html: "<div class='nonempty-cart'><p>You have items in your shopping cart. Would you like to merge items in this order with items of this shopping cart or replace them?</p>" +
							"<p>Select Cancel to stay on the current page.</p></div>",
						showCancelButton: true,
						confirmButtonText: 'Merge',
						cancelButtonText: 'Cancel'
					})
					$(".swal2-confirm.button").after('<button type="button" class="button replace-button">Replace</button>');
				} else {
					$overlay.show();
					addProductToCart(itemArr);
				}
				$(".swal2-confirm.button").on("click", function() {
					$overlay.show();
					addProductToCart(itemArr);
				});
				$(".replace-button").on("click", function() {
					swal.close();
					$overlay.show();
					replaceCart(cartItemIDs, itemArr);
					//replaceCart(cartItemIDs, cartId, itemArr);
				});
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

	let newListModal;
	const openCreateShoppingListModal = function(orderId) {
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
		        <form class="form" id="new_shopping_list_form" action="" method="post" data-order-id="${orderId}">
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
							},
							error: function() {
								$overlay.hide();
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