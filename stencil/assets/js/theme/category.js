import {
    hooks,
    api
} from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import $ from 'jquery';
import FacetedSearch from './common/faceted-search';
import './custom-category';
import config from './b2b/config';
export default class Category extends CatalogPage {
    loaded() {
        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }
        this.initB2bFeature();
    }
    initB2bFeature() {
        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
            $("#product-listing-container .productGrid").empty();
            $(".pagination").hide();
            if (sessionStorage.getItem("catalog_id")) {
                $("#product-listing-container").append(`<div class="pagination pagination-b2b">
                <ul class="pagination-list" id="jqPagination"></ul>
                </div>`);
                this.getAllProducts();
            } else {
                $(".catalog-listing-wrap").html("We can't find products matching the selection.");
            }
        }
    }

    getAllProducts() {
        const paginations = this.context.paginationCategory || [];
        const $productListingContainer = $('#product-listing-container');
        const catalogProducts = JSON.parse(sessionStorage.getItem("catalog_products") || "{}");
        let categoryProducts = [];
        const b2b_total_products = this.context.b2b_total_products || 0;
        let total_products_count = 0;
        if (paginations) {
            for (let i = 0; i < paginations.length; i++) {
                const formatUrl = paginations[i].url;
                const productsPerPage = this.context.categoryProductsPerPage;
                const requestOptions = {
                    config: {
                        category: {
                            shop_by_price: true,
                            products: {
                                limit: productsPerPage,
                            },
                        },
                    },
                    template: 'b2b/catalog-product-listing'
                };
                api.getPage(formatUrl, requestOptions, (err, content) => {

                    if (err) {
                        throw new Error(err);
                    }

                    let lis;

                    lis = $(content).find(">li.product");



                    lis.each(function() {
                        total_products_count++;
                        const product_id = $(this).attr("data-product-id");
                        if (catalogProducts[product_id]) {
                            categoryProducts.push($(this).html());
                        }

                    });

                    // if b2b_total_products == total_products_count, all products getted
                    if (b2b_total_products == total_products_count) {
                        const productsNum = categoryProducts.length;
                        const totalPage = Math.ceil(productsNum / productsPerPage);
                        if (productsNum > productsPerPage) {
                            $("#jqPagination").jqPaginator({
                                totalPages: totalPage,
                                visiblePages: 10,
                                currentPage: 1,
                                onPageChange: (num, type) => {
                                    const start = (num - 1) * productsPerPage;
                                    const end = (num * productsPerPage > productsNum) ? productsNum : num * productsPerPage;
                                    this.renderList(start, end, categoryProducts);

                                    //scrol to top after click page
                                    //const pheight = $productListingContainer.offset().top - 180;
                                    if (type == "change") {
                                        $('html, body').animate({
                                            scrollTop: 0,
                                        }, 100);
                                    }

                                }
                            });
                        } else {
                            //this.renderTable(0, productsNum, categoryProducts);
                            this.renderList(0, productsNum, categoryProducts);
                            $("#jqPagination").html("");
                        }

                    }



                    //$productListingContainer.append(lis);


                });
            }
        } else {
            $("[catalog-product]").hide();
            $("[catalog-product='true']").show();

        }
    }

    renderList(start, end, allItems) {

        const $productListingContainer = $('#product-listing-container');
        let productsHtml = "";
        for (let j = start; j < end; j++) {
            productsHtml += `<li class="product">${allItems[j]}</li>`;
        }

        $productListingContainer.find(".productGrid").html(productsHtml);
        $productListingContainer.find(".productList").html(productsHtml);

    }

    initFacetedSearch() {
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
            this.initB2bFeature();
        });
    }
}