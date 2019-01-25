import urlUtils from '../common/url-utils';
import Url from 'url';
import utils from '@bigcommerce/stencil-utils';
import _ from 'lodash';
import swal from 'sweetalert2';
import config from './config';
import ProductDetails from '../common/product-details';
import {
    defaultModal
} from '../global/modal';
import {
    get
} from 'https';

export default function(customer) {
    // list saleRep by frontend
    let is_sale_rep = false
    //store hash
    const bypass_store_hash = `${config.storeHash}`;
    const bypass_customer_id = customer.id;
    // const representative_id = "brucehuang1@qq.com"
    const representative_id = customer.email
    const $saleRepListTable = $("#sale-rep-table");
    const $overlay = $("#b2b_loading_overlay");
    let orderPerPage = 10; //num item of table
    let listDatas = []; // data source of table

    const renderTable = function(start, end, sort) {
        if (sort && sort.name) {
            // sort situation
            let renderLists = listDatas.slice(start, end)
            if (sort.value == 'asc') {
                renderLists = renderLists.sort((item1, item2) => companyFunctionDesc(item1, item2, sort.name))
            } else {
                renderLists = renderLists.sort((item1, item2) => companyFunction(item1, item2, sort.name))
            }

            $saleRepListTable.find('tbody').empty();
            let $impersonationId;
            if (sessionStorage.getItem("bundleb2b_sale")) {
                const saleInfo = JSON.parse(sessionStorage.getItem("bundleb2b_sale"));
                $impersonationId = saleInfo.company_id;
            }

            let isimpersonationchoose = false
            for (let i = 0; i < renderLists.length; i++) {
                let tr // table row
                let listData = renderLists[i]
                let admin_info = listData.admin.info
                isimpersonationchoose = (listData.company_id == $impersonationId)
                // sale rep info
                const sale_rep_name = listData.first_name + '' + listData.last_name;
                const representative_id = listData.representative_id;

                $('.sale-name').text(sale_rep_name)
                $('.sale-email').text(representative_id)
                $('.record-total').text(listDatas.length)
                // table info
                const company_name = listData.company_name;
                const company_id = listData.company_id;
                const company_admin = admin_info.first_name + '' + admin_info.last_name;
                const email_address = admin_info.email;
                const trId = listData.id
                const company_admin_impersonation = '<span class="button button--primary button--small view-action" action-begin-masquerade>Begin Masquerade</span>';
                tr = `<tr class="${isimpersonationchoose?'selected' : ''}" id="${trId}" data-company-id="${company_id}"><td><span class="company_name">${company_name}</span></td>
                <td class="col-product-info">
                    <span class="company_admin">${company_admin}</span>
                </td>
                <td class="t-align-l" >
                    <span class="email_address">${email_address}</span>
                </td>
                <td class="t-align-c col-sale-actions company_admin_impersonation">
                ${isimpersonationchoose?"<span class='selected'>selected</span>" : company_admin_impersonation}
            </td></tr>`
                $saleRepListTable.find('tbody').append(tr)

            }
        } else {
            // not sort situation
            $saleRepListTable.find('tbody').empty()
            let $impersonationId;
            if (sessionStorage.getItem("bundleb2b_sale")) {
                const saleInfo = JSON.parse(sessionStorage.getItem("bundleb2b_sale"));
                $impersonationId = saleInfo.company_id;
            }
            let isimpersonationchoose = false
            for (let i = start; i < end; i++) {
                let tr // table row
                let listData = listDatas[i]
                isimpersonationchoose = (listData.company_id == $impersonationId)
                let admin_info = listData.admin.info
                // sale rep info
                const sale_rep_name = listData.first_name + ' ' + listData.last_name;
                const representative_id = listData.representative_id;
                $('.sale-name').text(sale_rep_name)
                $('.sale-email').text(representative_id)
                $('.record-total').text(listDatas.length)
                // table info
                const company_name = listData.company_name;
                const company_admin = admin_info.first_name + ' ' + admin_info.last_name;
                const email_address = admin_info.email;
                const trId = listData.id;
                const company_id = listData.company_id;
                const company_admin_impersonation = '<span class="button button--primary button--small view-action" action-begin-masquerade>Begin Masquerade</span>';
                tr = `<tr class="${isimpersonationchoose?'selected' : ''}" id=${trId} data-company-id="${company_id}"><td><span class="company_name">${company_name}</span></td>
                <td class="col-product-info">
                    <span class="company_admin">${company_admin}</span>
                </td>
                <td class="t-align-l" >
                    <span class="email_address">${email_address}</span>
                </td>
                <td class="t-align-c col-sale-actions company_admin_impersonation">
                ${isimpersonationchoose?"<span class='selected'>selected</span>" : company_admin_impersonation}
            </td></tr>`
                $saleRepListTable.find('tbody').append(tr)
            }
        }
    }

    // listen impersonation click
    $('body').on('click', '[action-begin-masquerade]', function(event) {
        // direct clear cart data
        console.log('clear start')
        var cartData = []
        cartData = getCartItems()
        //$('.company_admin_impersonation').text('Begin Masquerade')
        let $target = $(event.target);
        console.log('target', $target, $target.parent().attr('id'))
        //let impersonation_id = $target.parents("tr").attr('id')
        //sessionStorage.setItem('impersonationId', impersonation_id);
        //$target.text('selected');

        /*elyn add start*/
        const $tr = $target.parents("tr");
        const company_id = $target.parents("tr").attr('data-company-id');
        const company_name = $target.parents("tr").find('.company_name').text() || "";
        const company_info = {
            "company_id": company_id,
            "company_name": company_name,
            "company_infobox": "true"
        }
        sessionStorage.setItem('bundleb2b_sale', JSON.stringify(company_info));
        $overlay.show();
        $.ajax({
            type: 'GET',
            url: `${config.apiRootUrl}/company?id=${company_id}`,
            success: function(data) {
                $overlay.hide();
                if (data) {
                    const catalog_id = data.catalog_id;
                    const company_status = data.company_status;

                    if (company_status == "APPROVED") {
                        const user_info = {
                            "user_id": bypass_customer_id,
                            "role_id": 10,
                            "company_id": company_id,
                        };
                        sessionStorage.setItem("bundleb2b_user", JSON.stringify(user_info));


                        if ($(".salerep-infobox").length > 0) {
                            $(".salerep-infobox").html(`<div class="container" style="overflow:hidden;"><span style="line-height:40px;">Viewing as ${company_name}</span><span class="button button--primary" style="float:right;margin: 0;" end-masquerade>End Masquerade</span></div>`);
                        } else {
                            $(".navUser").after(`<div class="salerep-infobox"><div class="container" style="overflow:hidden;"><span style="line-height:40px;">Viewing as ${company_name}</span><span class="button button--primary" style="float:right;margin: 0;" end-masquerade>End Masquerade</span></div></div>`);
                        }

                        if (!$(".bottom-end-masquerade").length) {
                            $(".table-wrap").after(`<div class="bottom-end-masquerade" style="text-align:right;"><a href="javascript:void(0);" class="button button--primary" end-masquerade>End Masquerade</a></div>`);
                        }

                        $("#user_shoppinglist_nav").show();
                        $tr.addClass("selected").siblings("tr").removeClass("selected");
                        $tr.find(".col-sale-actions").html(`<span class="selected">selected</span>`);
                        $tr.siblings("tr").find(".col-sale-actions").html(`<span class="button button--primary button--small view-action" action-begin-masquerade="">Begin Masquerade</span>`);

                        //add quick order pad link
                        // if (!$(".navUser-item--quickorder").length) {
                        //     $(".navUser-section").prepend(`<li class="navUser-item navUser-item--quickorder"><a class="navUser-action" href="/quick-order-pad/">Quick Order Pad</a></li>`);
                        // }

                        if (catalog_id) {
                            sessionStorage.setItem("catalog_id", catalog_id.toString());
                            // sessionStorage.setItem("bundleb2b_sale", JSON.stringify(bundleb2b_sale));

                            getCatalogProducts(catalog_id, function() {
                                // window.location.href = "/account.php?action=order_status";
                                // window.location.reload()
                                $overlay.hide();
                            });
                        } else {
                            // window.location.href = "/account.php?action=order_status";
                            // window.location.reload()
                            $overlay.hide();

                        }

                    }


                } else {
                    console.log('listSale get failed')
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $overlay.hide();
                console.log("error", JSON.stringify(jqXHR));
            }
        });
        /*elyn add end*/
    })

    // listen sort action
    $("body").on('click', '[data-sort-th]', (event) => {
        event.preventDefault();
        const $target = $(event.target);
        const sort_filter_name = $target.attr("data-sort-filter");
        console.log('进入了', sort_filter_name)
        let sort = {
            "name": sort_filter_name
        };
        if ($target.hasClass("asc")) {
            sort.value = "desc";
            console.log('desc')
            loadTable(sort);
        } else {
            sort.value = "asc";
            console.log('asc')
            loadTable(sort);
        }
    });

    const companyFunction = function(item1, item2, name) {
        if (name == 'company_admin') {
            return (item1.admin.info.first_name + +'' + item1.admin.info.last_name).localeCompare(item2.admin.info.first_name + +'' + item2.admin.info.last_name)
        } else if (name == 'email_address') {
            return (item2.admin.info.email).localeCompare(item1.admin.info.email)
        } else {
            return item1[name].localeCompare(item2[name])
        }
    }

    const companyFunctionDesc = function(item1, item2, name) {
        if (name == 'company_admin') {
            return (item2.admin.info.first_name + +'' + item2.admin.info.last_name).localeCompare(item1.admin.info.first_name + +'' + item1.admin.info.last_name)
        } else if (name == 'email_address') {
            return (item1.admin.info.email).localeCompare(item2.admin.info.email)
        } else {
            return item2[name].localeCompare(item1[name])
        }

    }

    //load table
    const loadTable = function(sort) {
        let data = listDatas;
        // handle pagination
        const orderNum = data.length;
        const totalPage = Math.ceil(orderNum / orderPerPage);
        if (sort && (typeof sort == 'object')) {
            const $cth = $(`[data-sort-filter="${sort.name}"]`);
            $cth.siblings('[data-sort-filter]').removeClass("asc");
            if (sort.value == "asc") {
                $cth.addClass("asc");
            } else {
                $cth.removeClass("asc");
            }
        }

        // if (orderNum > orderPerPage) {
        $("#jqPagination").jqPaginator({
            totalPages: totalPage,
            visiblePages: 10,
            currentPage: 1,
            onPageChange: function(num, type) {
                const start = (num - 1) * orderPerPage;
                const end = (num * orderPerPage > orderNum) ? orderNum : num * orderPerPage;
                renderTable(start, end, sort);
            }
        });


        // }
    }

    //get list saleRep
    const getSaleRepList = function() {
        $overlay.show();
        $.ajax({
            type: 'GET',
            url: `${config.apiRootUrl}/listSaleRepByFrontEnd?store_hash=${bypass_store_hash}&representative_id=${representative_id}`,
            success: function(data) {
                $overlay.hide();
                if (data.code == 200) {
                    if (data.response) {
                        // start load table
                        console.log(data.response);
                        listDatas = data.response
                        loadTable()
                        if (sessionStorage.getItem("bundleb2b_sale")) {
                            $(".table-wrap").after(`<div class="bottom-end-masquerade" style="text-align:right;"><a href="javascript:void(0);" class="button button--primary" end-masquerade>End Masquerade</a></div>`)
                        }
                    }
                } else {
                    console.log('listSale get failed')
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $overlay.hide();
                console.log("error", JSON.stringify(jqXHR));
            }
        })
    }

    // data and logic entrance
    $.ajax({
        type: "GET",
        url: `${config.apiRootUrl}/hasSaleRepByEmail?store_hash=${bypass_store_hash}&representative_id=${representative_id}`,
        success: function(data) {
            console.log('获取数据', data)
            if (data.code == 200) {
                if (data.response.count > 0) {
                    getSaleRepList();
                } else {
                    console.log('你不是销售代表');
                    window.location.href = "/account.php";
                    return;
                }

            } else {
                console.log('rep接口请求失败')
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log("error", JSON.stringify(jqXHR));
        }
    });

    // const getCartItems
    const getCartItems = function(){
        let cartItemIDs = [];
		$.ajax({
			type: "GET",
			url: "../api/storefront/carts",
			contentType: "application/json",
			accept: "application/json",
			async: true,
			success: (data) => {
                // debugger
				if (data && data.length > 0) {
                    
                    cartItemIDs = data[0].lineItems.physicalItems;
                    // return cartItemIDs
                    clearCart(cartItemIDs)
                    $overlay.hide();

                }
                
			
			},
			error: () => {
				$overlay.hide();
				swal({
					type: "error",
					text: "There has some error, please try again."
                });
                // return cartItemIDs
			}
        });
        return cartItemIDs
        
    }

    //clear cart contents
	const clearCart = function(cartItemArr) {
        console.log("clear cart",cartItemArr)
		const cartitem = cartItemArr[cartItemArr.length - 1];
		$overlay.show();
		utils.api.cart.itemRemove(cartitem.id, (err, response) => {
			if (response.data.status === 'succeed') {
				cartItemArr.pop();

				if (cartItemArr.length > 0) {
					clearCart(cartItemArr);
				} else {
                    // addProductToCart(itemArr);
                    $overlay.hide();
                    $('body').trigger('cart-quantity-update', 0);

                    return
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
    
    const getCatalogProducts = function(catalog_id, _callback) {
        //get catalog products
        $overlay.show();
        $.ajax({
            type: "GET",
            url: `${config.apiRootUrl}/catalogproducts?id=${catalog_id}`,
            success: function(data) {
                console.log("get catalog products", data);
                $overlay.hide();

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
                $overlay.hide();
                console.log("error", JSON.stringify(jqXHR));
            }
        });

    }

}