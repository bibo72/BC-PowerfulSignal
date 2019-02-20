import PageManager from './page-manager';
import $ from 'jquery';
import _ from 'lodash';
import giftCertCheck from './common/gift-certificate-validator';
import utils from '@bigcommerce/stencil-utils';
import ShippingEstimator from './cart/shipping-estimator';
import {
    defaultModal
} from './global/modal';
import swal from 'sweetalert2';
import config from './b2b/config';


export default class Cart extends PageManager {
    loaded(next) {
        this.$cartContent = $('[data-cart-content]');
        this.$cartMessages = $('[data-cart-status]');
        this.$cartTotals = $('[data-cart-totals]');
        this.$overlay = $('[data-cart] .loadingOverlay')
            .hide(); // TODO: temporary until roper pulls in his cart components

        this.bindEvents();

        // for bundleb2b2
        // only for powerfulsignal
        this.hideCuponCode();

        next();
    }

    cartUpdate($target) {
        const itemId = $target.data('cart-itemid');
        const $el = $(`#qty-${itemId}`);
        const oldQty = parseInt($el.val(), 10);
        const maxQty = parseInt($el.data('quantity-max'), 10);
        const minQty = parseInt($el.data('quantity-min'), 10);
        const minError = $el.data('quantity-min-error');
        const maxError = $el.data('quantity-max-error');
        const newQty = $target.data('action') === 'inc' ? oldQty + 1 : oldQty - 1;

        // Does not quality for min/max quantity
        if (newQty < minQty) {
            return swal({
                text: minError,
                type: 'error',
            });
        } else if (maxQty > 0 && newQty > maxQty) {
            return swal({
                text: maxError,
                type: 'error',
            });
        }

        this.$overlay.show();

        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            this.$overlay.hide();

            if (response.data.status === 'succeed') {
                // if the quantity is changed "1" from "0", we have to remove the row.
                const remove = (newQty === 0);

                //for bundleb2b
                if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
                    this.updateCatalogPrice(itemId);
                } else {
                    this.refreshContent(remove);
                }
            } else {
                $el.val(oldQty);
                swal({
                    text: response.data.errors.join('\n'),
                    type: 'error',
                });
            }
        });
    }

    cartRemoveItem(itemId) {
        this.$overlay.show();
        utils.api.cart.itemRemove(itemId, (err, response) => {
            if (response.data.status === 'succeed') {
                this.refreshContent(true);
            } else {
                swal({
                    text: response.data.errors.join('\n'),
                    type: 'error',
                });
            }
        });
    }

    cartEditOptions(itemId) {
        const modal = defaultModal();
        const options = {
            template: 'cart/modals/configure-product',
        };

        modal.open();

        utils.api.productAttributes.configureInCart(itemId, options, (err, response) => {
            modal.updateContent(response.content);

            this.bindGiftWrappingForm();
        });

        utils.hooks.on('product-option-change', (event, option) => {
            const $changedOption = $(option);
            const $form = $changedOption.parents('form');
            const $submit = $('input.button', $form);
            const $messageBox = $('.alertMessageBox');
            const item = $('[name="item_id"]', $form).attr('value');

            utils.api.productAttributes.optionChange(item, $form.serialize(), (err, result) => {
                const data = result.data || {};

                if (err) {
                    swal({
                        text: err,
                        type: 'error',
                    });
                    return false;
                }

                if (data.purchasing_message) {
                    $('p.alertBox-message', $messageBox).text(data.purchasing_message);
                    $submit.prop('disabled', true);
                    $messageBox.show();
                } else {
                    $submit.prop('disabled', false);
                    $messageBox.hide();
                }

                if (!data.purchasable || !data.instock) {
                    $submit.prop('disabled', true);
                } else {
                    $submit.prop('disabled', false);
                }
            });
        });
    }

    refreshContent(remove) {
        const $cartItemsRows = $('[data-item-row]', this.$cartContent);
        const $cartPageTitle = $('[data-cart-page-title]');
        const options = {
            template: {
                content: 'cart/content',
                totals: 'cart/totals',
                pageTitle: 'cart/page-title',
                statusMessages: 'cart/status-messages',
            },
        };

        this.$overlay.show();

        // Remove last item from cart? Reload
        if (remove && $cartItemsRows.length === 1) {
            return window.location.reload();
        }

        utils.api.cart.getContent(options, (err, response) => {
            this.$cartContent.html(response.content);
            this.$cartTotals.html(response.totals);
            this.$cartMessages.html(response.statusMessages);

            $cartPageTitle.replaceWith(response.pageTitle);
            this.bindEvents();
            this.$overlay.hide();

            const quantity = $('[data-cart-quantity]', this.$cartContent).data('cart-quantity') || 0;

            $('body').trigger('cart-quantity-update', quantity);

            // for bundleb2b2
            // only for powerfulsignal
            this.hideCuponCode();
        });
    }

    bindCartEvents() {
        const debounceTimeout = 400;
        const cartUpdate = _.bind(_.debounce(this.cartUpdate, debounceTimeout), this);
        const cartRemoveItem = _.bind(_.debounce(this.cartRemoveItem, debounceTimeout), this);

        // cart update
        $('[data-cart-update]', this.$cartContent).on('click', (event) => {
            const $target = $(event.currentTarget);

            event.preventDefault();

            // update cart quantity
            cartUpdate($target);
        });

        $('.cart-remove', this.$cartContent).on('click', (event) => {
            const itemId = $(event.currentTarget).data('cart-itemid');
            const string = $(event.currentTarget).data('confirm-delete');
            swal({
                text: string,
                type: 'warning',
                showCancelButton: true,
            }).then(() => {
                // remove item from cart
                cartRemoveItem(itemId);
            });
            event.preventDefault();
        });

        $('[data-item-edit]', this.$cartContent).on('click', (event) => {
            const itemId = $(event.currentTarget).data('item-edit');

            event.preventDefault();
            // edit item in cart
            this.cartEditOptions(itemId);
        });
    }

    bindPromoCodeEvents() {
        const $couponContainer = $('.coupon-code');
        const $couponForm = $('.coupon-form');
        const $codeInput = $('[name="couponcode"]', $couponForm);

        $('.coupon-code-add').on('click', (event) => {
            event.preventDefault();

            $(event.currentTarget).hide();
            $couponContainer.show();
            $('.coupon-code-cancel').show();
            $codeInput.focus();
        });

        $('.coupon-code-cancel').on('click', (event) => {
            event.preventDefault();

            $couponContainer.hide();
            $('.coupon-code-cancel').hide();
            $('.coupon-code-add').show();
        });

        $couponForm.on('submit', (event) => {
            const code = $codeInput.val();

            event.preventDefault();

            // Empty code
            if (!code) {
                return swal({
                    text: $codeInput.data('error'),
                    type: 'error',
                });
            }

            utils.api.cart.applyCode(code, (err, response) => {
                if (response.data.status === 'success') {
                    this.refreshContent();
                } else {
                    swal({
                        text: response.data.errors.join('\n'),
                        type: 'error',
                    });
                }
            });
        });
    }

    bindGiftCertificateEvents() {
        const $certContainer = $('.gift-certificate-code');
        const $certForm = $('.cart-gift-certificate-form');
        const $certInput = $('[name="certcode"]', $certForm);

        $('.gift-certificate-add').on('click', (event) => {
            event.preventDefault();
            $(event.currentTarget).toggle();
            $certContainer.toggle();
            $('.gift-certificate-cancel').toggle();
        });

        $('.gift-certificate-cancel').on('click', (event) => {
            event.preventDefault();
            $certContainer.toggle();
            $('.gift-certificate-add').toggle();
            $('.gift-certificate-cancel').toggle();
        });

        $certForm.on('submit', (event) => {
            const code = $certInput.val();

            event.preventDefault();

            if (!giftCertCheck(code)) {
                return swal({
                    text: $certInput.data('error'),
                    type: 'error',
                });
            }

            utils.api.cart.applyGiftCertificate(code, (err, resp) => {
                if (resp.data.status === 'success') {
                    this.refreshContent();
                } else {
                    swal({
                        text: resp.data.errors.join('\n'),
                        type: 'error',
                    });
                }
            });
        });
    }

    bindGiftWrappingEvents() {
        const modal = defaultModal();

        $('[data-item-giftwrap]').on('click', (event) => {
            const itemId = $(event.currentTarget).data('item-giftwrap');
            const options = {
                template: 'cart/modals/gift-wrapping-form',
            };

            event.preventDefault();

            modal.open();

            utils.api.cart.getItemGiftWrappingOptions(itemId, options, (err, response) => {
                modal.updateContent(response.content);

                this.bindGiftWrappingForm();
            });
        });
    }

    bindGiftWrappingForm() {
        $('.giftWrapping-select').change((event) => {
            const $select = $(event.currentTarget);
            const id = $select.val();
            const index = $select.data('index');

            if (!id) {
                return;
            }

            const allowMessage = $select.find(`option[value=${id}]`).data('allow-message');

            $(`.giftWrapping-image-${index}`).hide();
            $(`#giftWrapping-image-${index}-${id}`).show();

            if (allowMessage) {
                $(`#giftWrapping-message-${index}`).show();
            } else {
                $(`#giftWrapping-message-${index}`).hide();
            }
        });

        $('.giftWrapping-select').trigger('change');

        function toggleViews() {
            const value = $('input:radio[name ="giftwraptype"]:checked').val();
            const $singleForm = $('.giftWrapping-single');
            const $multiForm = $('.giftWrapping-multiple');

            if (value === 'same') {
                $singleForm.show();
                $multiForm.hide();
            } else {
                $singleForm.hide();
                $multiForm.show();
            }
        }

        $('[name="giftwraptype"]').click(toggleViews);

        toggleViews();
    }

    bindEvents() {
        this.bindCartEvents();
        this.bindPromoCodeEvents();
        this.bindGiftWrappingEvents();
        this.bindGiftCertificateEvents();

        // initiate shipping estimator module
        this.shippingEstimator = new ShippingEstimator($('[data-shipping-estimator]'));
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
                                    const extra_variant_id = this.getVariantIdByProductId();
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

    //for bundleb2b
    updateCatalogPrice(cartItemId, cb) {
        this.$overlay.show();
        $.ajax({
            type: "GET",
            url: "../api/storefront/carts",
            contentType: "application/json",
            accept: "application/json",
            success: (data) => {
                console.log("cart", data);
                if (data && data.length > 0) {
                    const cartId = data[0].id;
                    console.log("cartId", cartId);
                    //const cartItems = data[0].lineItems.physicalItems;
                    const cartItems_all = data[0].lineItems.physicalItems;
                    const cartItems = cartItems_all.filter(function(item) {
                        return item.parentId == null;
                    });

                    for (let i = 0; i < cartItems.length; i++) {

                        const cartItem = cartItems[i];
                        const itemId = cartItem.id;


                        if (cartItemId == itemId) {
                            const itemProductId = cartItem.productId;
                            const itemVariantId = cartItem.variantId;
                            const itemQty = cartItem.quantity;
                            const gCatalogId = sessionStorage.getItem("catalog_id");

                            const cartItemObj = {
                                "item_id": itemId,
                                "product_id": itemProductId,
                                "variant_id": itemVariantId,
                                "quantity": itemQty,
                                "catalog_id": gCatalogId
                            };

                            console.log("putdata", JSON.stringify(cartItemObj));

                            this.handlePickListOptions(cartItemObj, () => {
                                console.log("putdata2", JSON.stringify(cartItemObj));

                                const bypass_store_hash = `${config.storeHash}`;

                                $.ajax({
                                    type: "PUT",
                                    url: `${config.apiRootUrl}/cart?store_hash=${bypass_store_hash}&cart_id=${cartId}`,
                                    data: JSON.stringify(cartItemObj),
                                    success: (data) => {
                                        console.log("update price done.");
                                        window.location.reload();
                                    },
                                    error: (jqXHR, textStatus, errorThrown) => {
                                        this.$overlay.hide();
                                        alert("update catalog price error");
                                    }
                                });
                            });

                        }

                    }

                } else {
                    this.$overlay.hide();
                }
            },
            error: (jqXHR, textStatus, errorThrown) => {
                this.$overlay.hide();
                console.log("error", JSON.stringify(jqXHR));
                swal({
                    type: "error",
                    text: "There has some error, please try again."
                });
            }
        });

    }

    // for bundleb2b - not used
    updateCatalogPrice_old(cartItemId) {
        this.$overlay.show();
        $.ajax({
            type: "GET",
            url: "../api/storefront/carts",
            contentType: "application/json",
            accept: "application/json",
            success: (data) => {
                console.log("cart", data);
                if (data && data.length > 0) {
                    const cartId = data[0].id;
                    console.log("cartId", cartId);
                    const cartItems = data[0].lineItems.physicalItems;
                    // debugger
                    for (let i = 0; i < cartItems.length; i++) {
                        const cartItem = cartItems[i];
                        const itemId = cartItem.id;
                        if (cartItemId == itemId) {
                            const itemProductId = cartItem.productId;
                            const itemVariantId = cartItem.variantId;
                            const itemQty = cartItem.quantity;
                            const gCatalogId = sessionStorage.getItem("catalog_id");
                            const cartItemObj = {
                                "item_id": itemId,
                                "product_id": itemProductId,
                                "variant_id": itemVariantId,
                                "quantity": itemQty,
                                "catalog_id": gCatalogId
                            };
                            var normalCartItemObj = {
                                "item_id": itemId,
                                "product_id": itemProductId,
                                "quantity": itemQty,
                            }
                            console.log("putdata", JSON.stringify(cartItemObj));
                            const bypass_store_hash = `${config.storeHash}`;
                            if (!gCatalogId) {
                                if (itemVariantId) {
                                    normalCartItemObj.variant_id = itemVariantId;

                                }
                                $.ajax({
                                    type: "PUT",
                                    // /carts/{cartId}/items/{itemId}

                                    url: `../api/storefront/carts/${cartId}/${itemId}`,
                                    data: JSON.stringify({
                                        'line_item': normalCartItemObj
                                    }),
                                    success: (data) => {
                                        console.log("update price done.");
                                        window.location.reload();
                                    },
                                    error: (jqXHR, textStatus, errorThrown) => {
                                        this.$overlay.hide();
                                        alert("update catalog price error");
                                    }
                                });
                            } else {
                                $.ajax({
                                    type: "PUT",
                                    url: `${config.apiRootUrl}/cart?store_hash=${bypass_store_hash}&cart_id=${cartId}`,
                                    data: JSON.stringify(cartItemObj),
                                    success: (data) => {
                                        console.log("update price done.");
                                        window.location.reload();
                                    },
                                    error: (jqXHR, textStatus, errorThrown) => {
                                        this.$overlay.hide();
                                        alert("update catalog price error");
                                    }
                                });
                            }

                        }
                    }
                } else {
                    this.$overlay.hide();
                }
            },
            error: (jqXHR, textStatus, errorThrown) => {
                this.$overlay.hide();
                console.log("error", JSON.stringify(jqXHR));
                swal({
                    type: "error",
                    text: "There has some error, please try again."
                });
            }
        });
    }

    // for bundleb2b
    // only for powerful signal
    hideCuponCode() {
        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
            $(".coupon-code-add").parents(".cart-total").remove();
        }
    }
}