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
import pricesStyle from './prices-style';

export default function(customer) {
    console.log("quick order pad");
    //store hash
    const bypass_store_hash = `${config.storeHash}`;
    const bypass_customer_id = customer.id;
    const bypass_customer_email = customer.email;
    const $quickOrderPadTable = $("#quick_order_pad_table");
    const $overlay = $("#b2b_loading_overlay");

    let catalog_products = {}; //catalog products, get from sessionStorage
    let catalog_products_sku = {};
    let gCatalogId;
    let gRoleId;
    let bypass_company_id;
    const gPriceSymbol = "$";
    const tableDefaultRow = 5;
    const tableTrHtml = `<tr>
            <td class="col-action-left"><sapn class="remove-icon" data-remove-cell>&minus;</span></td>
            <td class="col-sku"><div class="product-info"><input class="form-input" type="text" data-sku><div class="sku-search-results"></div><span class="error-info">Invalid SKU <span>!</span></span></div></td>
            <td class="col-qty"><input class="form-input" type="text" data-qty></td>
            <td class="col-price"><span data-total-price></span></td>
        </tr>`;

    var interval = setInterval(function() {
        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") !== "none") {
            clearInterval(interval);
            $overlay.hide();
            if (sessionStorage.getItem("catalog_products")) {
                catalog_products = JSON.parse(sessionStorage.getItem("catalog_products"));
            }
            gCatalogId = sessionStorage.getItem("catalog_id");

            const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
            gRoleId = bundleb2b_user.role_id;
            bypass_company_id = bundleb2b_user.company_id;

            if (!gRoleId || gRoleId == "0" || (gRoleId == "10" && !bypass_company_id)) {
                return swal({
                    allowOutsideClick: false,
                    type: "error",
                    text: 'You can\'t access to this page.'
                }).then(() => {
                    window.location.href = "/";
                });
            }

            //init table row
            for (let i = 0; i < tableDefaultRow; i++) {
                $quickOrderPadTable.find("tbody").append(tableTrHtml);
            }
        }
        //console.log("loading icon is on",isLoadingOn);
    }, 100);

    //bind event
    //sku input - keyup
    $("body").on('keyup', '[data-sku]', function() {
        const $tr = $(this).parents("tr");
        const $searchResults = $tr.find(".sku-search-results");
        $searchResults.show();
        let searchQuery = $(this).val();
        if (searchQuery.length >= 1) {
            searchQuery = searchQuery.toLowerCase();
            doSearch(searchQuery, $searchResults);
        } else if (searchQuery.length == 0) {
            $searchResults.hide();
        }
    });

    //sku input - focus
    $("body").on('focus', '[data-sku]', function() {
        const $tr = $(this).parents("tr");
        let searchQuery = $(this).val() || "";
        if (searchQuery.trim().length > 0) {
            const $searchResults = $tr.find(".sku-search-results");
            $searchResults.show();
        }

    });

    //sku input - blur
    $("body").on('blur', '[data-sku]', function() {
        const $tr = $(this).parents("tr");
        const $searchResults = $tr.find(".sku-search-results");
        setTimeout(function() {
            $searchResults.hide();
        }, 200);
    });

    //search results item - click/select
    $("body").on("click", '[select-product-item]', function() {
        $overlay.show();
        const $tr = $(this).parents("tr");
        const $skuInput = $tr.find('[data-sku]');
        const $qtyInput = $tr.find('[data-qty]');
        $tr.find(".error-info").hide();

        const $totalPriceContainer = $tr.find('[data-total-price]');
        const product_id = $(this).attr('data-product-id');
        const variant_id = $(this).attr('data-variant-id');
        const variant_sku = $(this).attr('data-variant-sku');

        utils.api.product.getById(product_id, {
            template: 'b2b/quick-order-pad-product'
        }, (err, response) => {
            if (err) {
                $overlay.hide();
                return swal({
                    type: "error",
                    text: response.data.errors.join('\n')
                });
            }

            $overlay.hide();

            const product_priceValue = $(response).attr("data-product-priceValue");
            $tr.attr("data-product-id", product_id).attr("data-variant-id", variant_id).attr("data-price-value", product_priceValue);

            let qty = 1;
            if ($qtyInput.val()) {
                qty = $qtyInput.val();
            }

            const tier_price = getCatalogPrice(product_priceValue, product_id, variant_id, qty);
            $skuInput.hide().after(`
                <div class="product-details-container">
                    <div class="productInfo-sku">${variant_sku}</div>
                    ${response}
                </div>`);
            $skuInput.remove();
            const $priceContainer = $tr.find('[data-price]');
            $priceContainer.text(`${gPriceSymbol}${pricesStyle(tier_price,2)}`);
            if ($qtyInput.val()) {
                $totalPriceContainer.text(`${gPriceSymbol}${pricesStyle(parseFloat(tier_price*qty).toFixed(2),2)}`);
            }

            const hasOptions = $(response).attr("has-options");

            if (hasOptions == "true") {
                //get selected options
                $.ajax({
                    type: "GET",
                    url: `${config.apiRootUrl}/productvariants?store_hash=${bypass_store_hash}&product_id=${product_id}&variant_id=${variant_id}`,
                    success: function(data) {
                        console.log(data);
                        if (data && data.option_list) {
                            const options = data.option_list;
                            $tr.attr("data-product-options", JSON.stringify(options));
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.log("error", JSON.stringify(jqXHR));
                    }
                });

            }

        });


    });

    //replace non-number char
    $("body").on("keyup", '[data-qty]', function() {
        let cvalue = $(this).val();
        cvalue = cvalue.replace(/\D|^0/g, '');
        $(this).val(cvalue);
        if (cvalue) {
            $(this).removeClass("error");
        }
    });
    $("body").on("afterpaste", '[data-qty]', function() {
        let cvalue = $(this).val();
        cvalue = cvalue.replace(/\D|^0/g, '');
        $(this).val(cvalue);
        if (cvalue) {
            $(this).removeClass("error");
        }
    });

    //product qty - change
    $("body").on("change", '[data-qty]', function() {
        const $tr = $(this).parents("tr");
        const $priceContainer = $tr.find('[data-price]');
        const $totalPriceContainer = $tr.find('[data-total-price]');
        const qty = $(this).val();
        const product_id = $tr.attr("data-product-id");
        const variant_id = $tr.attr("data-variant-id");
        const base_price = $tr.attr("data-price-value");
        if (!qty) {
            return;
        }
        $(this).removeClass("error");
        if (product_id && variant_id) {
            const tier_price = getCatalogPrice(base_price, product_id, variant_id, qty);
            $priceContainer.text(`${gPriceSymbol}${pricesStyle(tier_price,2)}`);
            $totalPriceContainer.text(`${gPriceSymbol}${pricesStyle(parseFloat(tier_price*qty).toFixed(2),2)}`);
        }
    });

    //add to cart
    $("#add_to_cart").on('click', function() {
        const $trs = $("#quick_order_pad_table tbody tr");

        let allVaild = true;
        let itemArr = [];
        $trs.each(function(index, item) {
            const $tr = $(item);
            const itemQty = $tr.find("[data-qty]").val();
            const product_id = $tr.attr("data-product-id");
            const $productInput = $tr.find("[data-sku]");

            //reset
            $tr.find(".error-info").hide();
            $tr.find("[data-qty]").removeClass("error");

            if ($productInput.length > 0 && $productInput.val().trim() != "") {
                allVaild = false;
                $tr.find(".error-info").show();

                if (!itemQty) {
                    allVaild = false;
                    $tr.find("[data-qty]").addClass("error");
                }
            }
            if (product_id || itemQty) {
                if (!product_id) {
                    allVaild = false;
                    $tr.find(".error-info").show();
                }
                if (!itemQty) {
                    allVaild = false;
                    $tr.find("[data-qty]").addClass("error");
                }
                const inputOptions = [];
                if ($tr.find(".productInfo-options").length) {
                    const $requiredInput = $tr.find(".productInfo-options input[required]");
                    $requiredInput.each(function(indexInput, itemInput) {
                        if (!$(itemInput).val()) {
                            allVaild = false;
                        } else {
                            inputOptions.push({
                                "option_id": $(itemInput).attr("name").replace("attribute[", "").replace("]", ""),
                                "option_value": $(itemInput).val()
                            });
                        }

                    });


                }
                const productObj = {};
                productObj.product_id = $tr.attr("data-product-id");
                productObj.variant_id = $tr.attr("data-variant-id");
                productObj.quantity = $tr.find("[data-qty]").val();
                let options_list = JSON.parse($tr.attr("data-product-options") || '[]');

                if (inputOptions.length > 0) {
                    options_list = options_list.concat(inputOptions);
                }
                if (options_list.length > 0) {
                    productObj.options_list = options_list;
                }
                itemArr.push(productObj);

            }

        });

        if (!allVaild) {
            return swal({
                type: "error",
                text: "Please fill in your product information."
            });
        }

        console.log(itemArr);

        if (itemArr.length == 0) {
            return swal({
                type: "error",
                text: "Please fill in your product information."
            });
        }

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

    // csv upload add to cart
    $("#add_to_cart_csv").on('click', function() {
        const $trs = $("#quick_order_pad_table_csv tbody tr");

        let allVaild = true;
        let itemArr = [];
        $trs.each(function(index, item) {
            const $tr = $(item);
            const itemQty = $tr.find("[data-qty]").text();
            const product_id = $tr.attr("data-product-id");
            if (product_id || itemQty) {
                const inputOptions = [];
                if ($tr.find(".productInfo-options").length) {
                    const $requiredInput = $tr.find(".productInfo-options input[required]");
                    $requiredInput.each(function(indexInput, itemInput) {
                        if (!$(itemInput).val()) {
                            allVaild = false;
                        } else {
                            inputOptions.push({
                                "option_id": $(itemInput).attr("name").replace("attribute[", "").replace("]", ""),
                                "option_value": $(itemInput).val()
                            });
                        }

                    });


                }
                const productObj = {};
                productObj.product_id = $tr.attr("data-product-id");
                productObj.variant_id = $tr.attr("data-variant-id");
                productObj.quantity = itemQty;
                let options_list = JSON.parse($tr.attr("data-product-options") || '[]');

                if (inputOptions.length > 0) {
                    options_list = options_list.concat(inputOptions);
                }
                if (options_list.length > 0) {
                    productObj.options_list = options_list;
                }
                itemArr.push(productObj);

            }

        });

        if (!allVaild) {
            return swal({
                type: "error",
                text: "Please fill out options."
            });
        }

        console.log(itemArr);

        if (itemArr.length == 0) {

            return swal({
                type: "error",
                text: "Please upload you products."
            });;
        }

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

    //remove line
    $("body").on("click", '[data-remove-cell]', function() {
        const $tr = $(this).parents("tr");
        $tr.remove();
    });

    //add line
    $("body").on("click", '#add_new_row', function() {
        $quickOrderPadTable.find("tbody").append(tableTrHtml);
    });

    //search sku in catalog_products
    const doSearch = _.debounce((searchQuery, $resultList) => {
        $resultList.html("<ul></ul>");
        let resultsCount = 0;

        for (let pid in catalog_products) {
            if (resultsCount >= 50) {
                return;
            }
            const variants_arr = catalog_products[pid];
            $.each(variants_arr, function(vindex, vitem) {
                if (resultsCount >= 50) {
                    return;
                }
                const variant_sku = vitem.variant_sku;
                const product_id = vitem.product_id;
                const variant_id = vitem.variant_id;
                if (variant_sku.toLowerCase().indexOf(searchQuery) != -1) {
                    resultsCount++;
                    $resultList.find("ul").append(`
                        <li select-product-item 
                        data-product-id="${product_id}"
                        data-variant-id="${variant_id}"
                        data-variant-sku="${variant_sku}"
                        >${variant_sku}</li>
                    `);

                }

            });
        }

        if (resultsCount == 0) {
            $resultList.find("ul").append(`<li>No products found.</li>`);
        }
    }, 200);


    //file upload
    //sample data: [244, 287, "SKU100", "SKU-9BB3516E", "1", empty]
    const displayCsvProducts = function(products) {
        let csvProdcutsArr = [];
        $("#add_to_cart_csv").prop("disabled", true);
        const $csvCheckInfoContainer = $("#csv_check_info");
        const $csvProdcutsContainer = $("#csv_products_list");
        $csvCheckInfoContainer.html("Loading products...");
        //$csvProdcutsContainer.html(`<table class="search-product-table" product-search-result-table><tbody></tbody></table>`);
        $csvProdcutsContainer.html(`
            <table class="quick-order-pad-table" id="quick_order_pad_table_csv">
                <thead class="has-line">
                    <tr>
                        <th>SKU#</th>
                        <th class="th-col-quantity">Quantity</th>
                        <th class="th-col-price">Price</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>`);

        const $csvProdcutsTbody = $csvProdcutsContainer.find("tbody");

        const productCount = products.length;

        for (let i = 0; i < productCount; i++) {
            const product_id = products[i][0];
            const variant_id = products[i][1];
            const variant_sku = products[i][2];
            const product_qty = products[i][3];
            const product_options = products[i][4];

            //shopping-list-csv-product-item
            utils.api.product.getById(product_id, {
                template: 'b2b/quick-order-pad-product-csv'
            }, (err, response) => {
                if (err) {
                    return console.log(err);
                }
                const tmpIndex = i;
                const $response = $(response);
                const base_priceValue = $response.attr("data-product-priceValue");
                const hasOptions = $response.attr("has-options");
                const tierPrice = getCatalogPrice(base_priceValue, product_id, variant_id, product_qty);

                const tr = `
                    <tr data-variant-id="${variant_id}"  data-product-id="${product_id}" csv-tr-${i}>
                        <td class="col-sku">
                            <div class="product-info">
                                <span>${variant_sku}</span>
                                ${response}
                        </td>
                        <td class="col-qty"><span data-qty>${product_qty}</span></td>
                        <td class="col-price"><span data-total-price>${gPriceSymbol}${pricesStyle(parseFloat(tierPrice*product_qty).toFixed(2),2)}</span></td>
                    </tr>`;

                $csvProdcutsTbody.append(tr);

                const $tr = $csvProdcutsTbody.find(`tr[csv-tr-${i}]`);

                if (tmpIndex == productCount - 1) {
                    $csvCheckInfoContainer.html("");
                    $("#add_to_cart_csv").prop("disabled", false);
                }

                const $inputOptions = $tr.find(".productInfo-options input.form-input");

                if ($inputOptions.length > 0) {
                    if (product_options && product_options.trim() != "") {
                        const product_options_arr = product_options.split(";");
                        $inputOptions.each((index, item) => {
                            if (product_options_arr && product_options_arr.length >= index + 1) {
                                $(item).val(product_options_arr[index]);
                            }
                        });
                    }
                }

                if (hasOptions == "true") {
                    //get selected options
                    $.ajax({
                        type: "GET",
                        url: `${config.apiRootUrl}/productvariants?store_hash=${bypass_store_hash}&product_id=${product_id}&variant_id=${variant_id}`,
                        success: function(data) {
                            console.log(data);
                            if (data && data.option_list) {
                                const options = data.option_list;
                                $tr.attr("data-product-options", JSON.stringify(options));
                            }
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            console.log("error", JSON.stringify(jqXHR));
                        }
                    });

                }

            });
        }

    }

    const resetCsvFileUpload = function() {
        $("#csv_check_info").html("");
        $("#csv_products_list").html("");
        $("#customer_sku_csv").val("");
    }
    const uploadDealcsv = function() {};
    /*------ Method for read uploded csv file ------*/
    uploadDealcsv.prototype.getCsv = function(e) {

        let input = document.getElementById('customer_sku_csv');
        input.addEventListener('change', function() {

            if (this.files && this.files[0]) {
                var uploadFile = this.files[0];
                var reader = new FileReader();

                reader.addEventListener('load', function(e) {
                    resetCsvFileUpload();

                    let csvdata = e.target.result;
                    console.log(csvdata);
                    const data = parseCsv.validation(csvdata);
                    console.log(data);
                });

                reader.readAsBinaryString(uploadFile);
            }
        });
    }
    /*------- Method for parse csv data and display --------------*/
    uploadDealcsv.prototype.validation = function(content) {
        const $csvCheckInfoContainer = $("#csv_check_info");
        $csvCheckInfoContainer.html(`<p class="checking-tips">Checking file...</p>`);
        let parsedata = [];
        let originArr = [];
        let errorCounter = 0;
        if (content) {
            originArr = content.split("\n");
        }
        console.log(originArr);


        parseCsv.removeEmptyRow(originArr);
        let unEmptyArr = originArr;

        let columns = 0;
        if (unEmptyArr && unEmptyArr.length > 0) {
            const headerRow = unEmptyArr[0];
            const headerArr = headerRow.split(",");
            //["variant_sku", "qty", "options", "", ""]
            parseCsv.removeEmptyRow(headerArr);
            columns = headerArr.length;
            console.log(headerArr);

        } else {
            $csvCheckInfoContainer.html(`<div class="checking-info-box">Empty file, please upload another.</div>`);
            return null;
        }

        for (let i = 1; i < unEmptyArr.length; i++) {


            let productIdsArr = "";
            const dataItem = unEmptyArr[i].split(",");
            //console.log(dataItem); //["SKU074", "1", "", "", ""]

            parseCsv.removeEmptyRow(dataItem);

            //console.log(dataItem); //["SKU074", "1", "", "", ""]

            let errorInfo = "";
            if (dataItem.length > columns) {
                errorInfo += `redundant data; `;
            } else {
                dataItem.length = columns;
            }
            if (!dataItem[0]) {
                errorInfo += `variant_sku can't be empty; `;
            } else {
                const idsArr = getIdsByVariantSku(dataItem[0]);
                if (idsArr && idsArr.length > 0) {
                    productIdsArr = idsArr;
                } else {
                    errorInfo += `variant_sku ${dataItem[0]} doesn't exist; `;
                }
            }
            if (!dataItem[1]) {
                errorInfo += `qty can't be empty; `;
            }

            if (errorInfo.trim() != "") {
                errorCounter++;
                $csvCheckInfoContainer.append(`<div>#ROW ${i+1}: ${errorInfo}</div>`);
            }
            const productDataArr = productIdsArr.concat(dataItem);

            parsedata.push(productDataArr);

        }
        console.log(parsedata);

        if (errorCounter == 0) {
            $csvCheckInfoContainer.html(`<div>File check passed.</div>`);
            displayCsvProducts(parsedata);

        } else {
            $csvCheckInfoContainer.append(`<div style="font-weight:600;">Your file has ${errorCounter} errors, please correct them and upload the file again.</div>`);
            $csvCheckInfoContainer.find(".checking-tips").remove();
        }
        return parsedata;
    }

    uploadDealcsv.prototype.isEmptyRow = function(arr) {
        //[,,,,,]
        const tmpArr = arr.split(",");
        for (let k = 0; k < tmpArr.length; k++) {
            //console.log(tmpArr[k]);
            if (tmpArr[k] && tmpArr[k] != "" && tmpArr[k] != null) {
                return false;
            }
        }
        return true;
    }
    uploadDealcsv.prototype.removeEmptyRow = function(arr) {
        const tmpArr = arr;
        if (parseCsv.isEmptyRow(tmpArr[tmpArr.length - 1])) {
            tmpArr.pop();
            parseCsv.removeEmptyRow(tmpArr);
        } else {
            return tmpArr;
        }
    }
    var parseCsv = new uploadDealcsv();
    parseCsv.getCsv();


    //drag to upload csv
    const dragToUploadCsv = function() {
        const dragArea = document.getElementById("drag_upload_csv");
        dragArea.ondragenter = function(e) {
            e.preventDefault();
            this.style.borderColor = "#000";
        }

        dragArea.ondragover = function(e) {
            e.preventDefault();
            this.style.borderColor = "#000";
        }

        dragArea.ondragleave = function(e) {
            e.preventDefault();
            this.style.borderColor = "transparent";
        }

        dragArea.ondrop = function(e) {
            e.preventDefault();
            this.style.borderColor = "transparent";
            var uploadFile = e.dataTransfer.files[0];

            //chech file extension
            const reg = new RegExp("[.](csv)$");
            if (!reg.test(uploadFile.name)) {
                return swal({
                    type: "error",
                    text: 'Please uplaod a CSV file.'
                });
            }
            var reader = new FileReader();
            reader.addEventListener('load', function(e) {
                resetCsvFileUpload();

                let csvdata = e.target.result;
                console.log(csvdata);
                const data = parseCsv.validation(csvdata);
                console.log(data);
            });

            reader.readAsBinaryString(uploadFile);
        }
    };

    dragToUploadCsv();


    /**
    get catalog price
    base_price float
    tier_price array
    qty number
    **/
    const getCatalogPrice = function(base_price, productId, variantId, qty) {
        let catalog_price = base_price;
        if (catalog_products[productId]) {
            const variants = catalog_products[productId];

            for (let i = 0; i < variants.length; i++) {
                const variantObj = variants[i];
                const variant_id = variantObj.variant_id;
                const variant_sku = variantObj.variant_sku;
                const catalog_price_arr = variantObj.tier_price || [];
                if (variant_id == variantId) {
                    catalog_price_arr.sort(function(a, b) {
                        if (parseInt(a.qty) >= parseInt(b.qty)) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });

                    for (let j = 0; j < catalog_price_arr.length; j++) {
                        if (parseInt(qty) >= parseInt(catalog_price_arr[j].qty)) {
                            if (catalog_price_arr[j].type == "fixed") {
                                catalog_price = catalog_price_arr[j].price;

                            } else {
                                catalog_price = base_price - base_price * catalog_price_arr[j].price / 100;
                            }
                        }
                    }
                }
            }
        }
        return parseFloat(catalog_price).toFixed(2);
    }

    const getIdsByVariantSku = function(variantSku) {
        //debugger
        console.log(catalog_products);
        let idsArr = [];
        for (let pid in catalog_products) {
            const variant_item = catalog_products[pid];
            for (let i = 0; i < variant_item.length; i++) {
                const variant_sku = variant_item[i].variant_sku;
                if (variant_sku == variantSku) {
                    idsArr.push(variant_item[i].product_id);
                    idsArr.push(variant_item[i].variant_id);
                    return idsArr;
                }
            }
        }

        return idsArr;

    }

    // Add item to cart
    const addProductToCart = function(itemArr) {

        const item = itemArr[itemArr.length - 1];
        console.log("add item to cart...", item);

        const formData = new FormData();
        formData.append("action", "add");
        formData.append("product_id", item.product_id);
        formData.append("qty[]", item.quantity);

        const options_list = item.options_list || [];
        for (let i = 0; i < options_list.length; i++) {
            formData.append(`attribute[${options_list[i].option_id}]`, options_list[i].option_value);
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
            if (response.data.status === 'succeed') {
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

    const updateCatalogPrice = function(cartItemsArr, cartId) {
        const cartItemObj = cartItemsArr[cartItemsArr.length - 1];
        delete cartItemObj.option_text;
        console.log("putdata", JSON.stringify(cartItemObj));

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

    }


}