import $ from 'jquery';
import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import StencilDropDown from './stencil-dropdown';

export default function () {
    const TOP_STYLING = 'top: 49px;';
    const $quickSearchResults = $('.quickSearchResults');
    const $quickSearchDiv = $('#quickSearch');
    const $searchQuery = $('#search_query');
    const stencilDropDownExtendables = {
        hide: () => {
            $searchQuery.blur();
        },
        show: (event) => {
            $searchQuery.focus();
            event.stopPropagation();
        },
    };
    const stencilDropDown = new StencilDropDown(stencilDropDownExtendables);
    stencilDropDown.bind($('[data-search="quickSearch"]'), $quickSearchDiv, TOP_STYLING);

    stencilDropDownExtendables.onBodyClick = (e, $container) => {
        // If the target element has this data tag or one of it's parents, do not close the search results
        // We have to specify `.modal-background` because of limitations around Foundation Reveal not allowing
        // any modification to the background element.
        if ($(e.target).closest('[data-prevent-quick-search-close], .modal-background').length === 0) {
            stencilDropDown.hide($container);
        }
    };

    // stagger searching for 200ms after last input
    const doSearch = _.debounce((searchQuery) => {
        utils.api.search.search(searchQuery, { template: 'search/quick-results' }, (err, response) => {
            if (err) {
                return false;
            }

            $quickSearchResults.html(response);
            handleCatalogProducts();
        });
    }, 200);

    utils.hooks.on('search-quick', (event) => {
        const searchQuery = $(event.currentTarget).val();

        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user")!="none") {
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
        }
        // server will only perform search with at least 3 characters
        if (searchQuery.length < 3) {
            return;
        }

        doSearch(searchQuery);
    });

    if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
        $('.snize-ac-results').css("display", "none");
        $searchQuery.on('focus', event => {
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
        });
        $searchQuery.unbind('keydown').bind('keydown', function(e) {
            const key = e.which;
            if (key == 13) {
                console.log("key enter");
                e.preventDefault();
                $quickSearchDiv.find("form").submit();
            }
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
        });
        $searchQuery.on('keyup', function(e) {
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
        });
    }
    // Catch the submission of the quick-search
    $quickSearchDiv.on('submit', (event) => {
        const searchQuery = $(event.currentTarget).find('input').val();

        if (searchQuery.length === 0) {
            return event.preventDefault();
        }

        return true;
    });
    const handleCatalogProducts = function() {
        if (sessionStorage.getItem("catalog_products")) {
            const catalog_products = JSON.parse(sessionStorage.getItem("catalog_products"));
            const products = $(".quickSearchResults .product");
            for (var product_id in catalog_products) {
                const productSelector = `[catalog-product-${product_id}]`;
                if ($(`${productSelector}`).length > 0) {
                    $(`${productSelector}`).attr("catalog-product", "true");
                    let base_price = $(`${productSelector}`).find(".price.price--withTax").text().replace("$", "") || $(`${productSelector}`).find(".price.price--withoutTax").text().replace("$", "");
                    let tier_price;
                    let catalog_price;
                    const variantArr = catalog_products[product_id] || [];
                    if (variantArr.length == 1) {
                        tier_price = variantArr[0].tier_price || [];
                        catalog_price = getCatalogPrice(base_price, tier_price, 1);
                    }
                    if (catalog_price) {
                        $(`${productSelector}`).find(".price.price--withoutTax").text("$" + parseFloat(catalog_price).toFixed(2));
                        $(`${productSelector}`).find(".price.price--withTax").text("$" + parseFloat(catalog_price).toFixed(2));
                    }
                }
            }
            const $productGallery = $(".quickSearchResults [b2b-products-gallery]");
            $productGallery.each(function() {
                const catalogProductCount = $(this).find("[catalog-product]").length;
                if (catalogProductCount == 0) {
                    $(this).parents(".quickSearchResults").html(`<p class="quickSearchMessage">0 product results for 'oiy'</p>`);
                } else {
                    const $catalogProductCounter = $("[data-catalog-product-counter]");
                    if ($catalogProductCounter.length > 0) {
                        $catalogProductCounter.text(catalogProductCount);
                    }
                }
            });
        } else {
            $(".quickSearchResults .product").css("display", "inline-block");
        }
    };
    const getCatalogPrice = function(base_price, tier_price_array, qty) {
        let tier_price = base_price;
        for (let j = 0; j < tier_price_array.length; j++) {
            const type = tier_price_array[j].type;
            const base_qty = tier_price_array[j].qty;
            const price = tier_price_array[j].price;
            if (qty >= base_qty) {
                if (type == "fixed") {
                    tier_price = price;
                } else {
                    tier_price = base_price - base_price * price / 100;
                }
            }
        }
        return tier_price;
    }
}
