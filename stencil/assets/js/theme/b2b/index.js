import $ from 'jquery';

import shippingLists from './shopping-lists';
import shippingList from './shopping-list';
import userManagement from './user-management';
import config from './config';

export default function() {
  //hide wishlist and account settings when user belongs to a company
  function hideWishlist() {
    var $accountNav = $(".navBar-action");
    //console.log("$accountNav: ",$accountNav);
    $.each($accountNav, function(index, item) {
      if ($($accountNav[index]).attr('href') === '/wishlist.php' || $($accountNav[index]).attr('href') === '/account.php?action=account_details') {
        $(this).parent().hide();
      }
    });
  }

  function displayWishlist() {
    var $accountNav = $(".navBar-action");
    //console.log("$accountNav: ",$accountNav);
    $.each($accountNav, function(index, item) {
      if ($($accountNav[index]).attr('href') === '/wishlist.php' || $($accountNav[index]).attr('href') === '/account.php?action=account_details') {
        $(this).parent().show();
      }
    });
  }
  //hide add to cart btn in listing page for b2b users
  function hideATCBtn() {
    var $addCartView = $(".listItem-buttons a.button");
    console.log("inside hideATC: ", $addCartView);
    $.each($addCartView, function(index, item) {
      if ($(this).html() === 'Add to Cart') {
        $(this).hide();
      }
    });
  }

  function displayATCBtn() {
    var $addCartView = $(".listItem-buttons a.button");
    $.each($addCartView, function(index, item) {
      if ($(this).html() === 'Add to Cart') {
        $(this).show();
      }
    });
  }
  if (this.context.customer && this.context.customer != null) {
    hideWishlist();
    hideATCBtn();
    const bypass_store_hash = `${config.storeHash}`;
    const bypass_email = this.context.customer.email;
    const bypass_customer_id = this.context.customer.id;

    console.log("logged in customer: email=%s id=%s", bypass_email, bypass_customer_id)


    const getUserInfo = function(_callback1, _callback2) {
      //get role id
      $.ajax({
        type: "GET",
        url: `${config.apiRootUrl}/company?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`,
        success: function(data) {
          console.log("get company users:", data);
          if (data && JSON.stringify(data) != "{}") {
            const userList = data.customers;
            const company_id = data.id;
            const catalog_id = data.catalog_id;
            let role_id = "";

            for (let i = 0; i < userList.length; i++) {
              if (userList[i].id == bypass_customer_id) {
                role_id = userList[i].role;
              }
            }

            const user_info = {
              "user_id": bypass_customer_id,
              "role_id": role_id,
              "company_id": company_id,
            };
            sessionStorage.setItem("bundleb2b_user", JSON.stringify(user_info));
            sessionStorage.setItem("catalog_id", catalog_id.toString());
            console.log(catalog_id.toString());

            if (_callback1) {
              _callback1();
            }

            getCatalogProducts(catalog_id, _callback2);
          } else {
            sessionStorage.removeItem("bundleb2b_user");
            sessionStorage.removeItem("catalog_id");
            sessionStorage.removeItem("catalog_products");
            $(".productGrid").find(".product").css("display", "inline-block");
            $(".productCarousel").find(".productCarousel-slide").css("display", "inline-block");
            $("[catalog-listing-wrap]").show();
            $("[home-catalog-product]").show();
            displayWishlist();
            displayATCBtn();
          }



        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log("error", JSON.stringify(jqXHR));
        }
      });
    }

    const handleRoleId = function() {
      const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
      if (bundleb2b_user.role_id == "0") {
        $("#form-action-addToCart").hide();
        $("#user_shoppinglist_nav").show();

      } else if (bundleb2b_user.role_id == "1" || bundleb2b_user.role_id == "2") {
        console.log("Admin User");
        $("#user_management_nav").show();
        $("#user_shoppinglist_nav").show();
      }

      handleCatalogProducts();


      $(".snize-ac-results").addClass("b2b-hidden");
      $("section.quickSearchResults").addClass("b2b-visible");
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

    const getCatalogPrice = function(base_price, tier_price_array, qty) {
      //let tier_price = base_price;
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


    const handleCatalogProducts = function() {
      const catalog_products = JSON.parse(sessionStorage.getItem("catalog_products"));
      const products = $(".product");

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

      //home catlog products
      const $homeCatalogProducts = $("[home-catalog-product]");
      $homeCatalogProducts.each(function() {
        if ($(this).find("[catalog-product]").length == 0) {

        } else {
          $(this).show();
        }
      });

      //productCarousel
      const $productCarousel = $("[b2b-products-carousel]");
      $productCarousel.each(function() {
        $(this).slick('slickFilter', '[catalog-product]');
        $(this).slick('slickGoTo', 0);
      });

      //product Gallery, for listing page
      const $productGallery = $("[b2b-products-gallery]");
      $productGallery.each(function() {
        const catalogProductCount = $(this).find("[catalog-product]").length;
        if (catalogProductCount == 0) {
          $("[catalog-listing-wrap]").show();
          $(this).parents(".page").html("We can't find products matching the selection.");
        } else {
          $("[catalog-listing-wrap]").show();
          const $catalogProductCounter = $("[data-catalog-product-counter]");
          if ($catalogProductCounter.length > 0) {
            $catalogProductCounter.text(catalogProductCount);
          }
        }
      });

    };

    /*if (sessionStorage.getItem("catalog_products")) {
        console.log("sessionStorage catalog_products");
        handleCatalogProducts();

        //get the latest info
        setTimeout(function() {
            getCatalogProducts();
        }, 3000);

    } else {
        console.log("NO sessionStorage catalog_products");
        getCatalogProducts(function() {
            handleCatalogProducts();
        });
    }*/

    if (sessionStorage.getItem("bundleb2b_user")) {
      console.log("sessionStorage bundleb2b_user");
      handleRoleId();
      //get the latest info
      setTimeout(function() {
        getUserInfo();
      }, 3000);
    } else {
      console.log("NO sessionStorage bundleb2b_user");
      getUserInfo(function() {
        handleRoleId();
      }, function() {
        handleCatalogProducts();
      });
    }

  } else {
    $(".productGrid").find(".product").css("display", "inline-block");
    $(".productCarousel").find(".productCarousel-slide").css("display", "inline-block");
    $("[catalog-listing-wrap]").show();
    $("[home-catalog-product]").show();
    sessionStorage.removeItem("bundleb2b_user");
    sessionStorage.removeItem("catalog_id");
    sessionStorage.removeItem("catalog_products");
  }

  const page_templete = this.context.page_templete.replace(/\\/g, '/');
  if (page_templete == 'pages/custom/page/shopping-lists') {
    if (this.context.customer && this.context.customer != null) {
      shippingLists(this.context.customer);
    } else {
      window.location = this.context.urls.auth.login;
    }
  }
  if (page_templete == 'pages/custom/page/shopping-list') {

    if (this.context.customer && this.context.customer != null) {
      shippingList(this.context.customer);
    } else {
      window.location = this.context.urls.auth.login;
    }
  }
  if (page_templete == 'pages/custom/page/user-management') {

    if (this.context.customer && this.context.customer != null) {
      userManagement(this.context.customer);
    } else {
      window.location = this.context.urls.auth.login;
    }
  }
}
