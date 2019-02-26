import $ from 'jquery';

import shippingLists from './shopping-lists';
import shippingList from './shopping-list';
import userManagement from './user-management';
import orderLists from './order-lists';
import orderDetails from './order-details';
import salerep from './salerep';
import companyRegistry from './company-register';
import companyRegistry2 from './company-register2';
import quickOrderPad from './quick-order-pad';
import accountSetting from './account-setting';
import config from './config';
import swal from 'sweetalert2';

export default function() {
  const accountSettingUrl = this.context.urls.account.details;
  const gPartnerLink = "/become-a-partner/";
  const gPartnerName = "Become a Partner";

  //hide wishlist and account settings when user belongs to a company
  function hideWishlist() {
    var $accountNav = $(".navBar-action");
    //console.log("$accountNav: ",$accountNav);
    $.each($accountNav, function(index, item) {
      //if ($($accountNav[index]).attr('href').indexOf('/wishlist.php') != -1 || $($accountNav[index]).attr('href').indexOf('/account.php?action=account_details') != -1) {
      if ($($accountNav[index]).attr('href').indexOf('/wishlist.php') != -1) {
        $(this).parent().hide();
      }
    });
  }

  function displayWishlist() {
    var $accountNav = $(".navBar-action");
    //console.log("$accountNav: ",$accountNav);
    $.each($accountNav, function(index, item) {
      if ($($accountNav[index]).attr('href').indexOf('/wishlist.php') != -1 || $($accountNav[index]).attr('href').indexOf('/account.php?action=account_details') != -1) {
        $(this).parent().show();
      }
    });
  }
  //hide add to cart btn in listing page for b2b users
  function hideATCBtn() {
    var $addCartView = $("a.button--small.card-figcaption-button");
    $.each($addCartView, function(index, item) {
      if ($(this).html() === 'Add to Cart') {
        $(this).hide();
      }
    });
  }

  function displayATCBtn() {
    var $addCartView = $("a.button--small.card-figcaption-button");
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

    const page_templete = this.context.page_templete.replace(/\\/g, '/');
    //console.log(page_templete);

    const getUserInfo = function(_callback1, _callback2) {
      //get role id
      $.ajax({
        type: "GET",
        url: `${config.apiRootUrl}/company?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`,
        success: (data) => {
          console.log("get company users:", data);
          let company_status;
          if (data && JSON.stringify(data) != "{}") {
            company_status = data.company_status;
          }

          if (company_status && company_status == "APPROVED") {

            const userList = data.customers;
            const company_id = data.id;
            const company_name = data.company_name;
            const catalog_id = data.catalog_id;
            const company_payments = data.payments;
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
              "company_name": company_name
            };
            sessionStorage.setItem("bundleb2b_user", JSON.stringify(user_info));
            if (catalog_id) {
              sessionStorage.setItem("catalog_id", catalog_id.toString());
              console.log(catalog_id.toString());
            }
            if (company_payments) {
              sessionStorage.setItem("company_payments", JSON.stringify(company_payments));
              console.log(company_payments.toString());
            }



            if (_callback1) {
              _callback1();
            }
            if (catalog_id) {
              getCatalogProducts(catalog_id, _callback2);
            }


          } else {
            sessionStorage.setItem("bundleb2b_user", "none");
            sessionStorage.removeItem("catalog_id");
            sessionStorage.removeItem("catalog_products");
            sessionStorage.removeItem("company_payments");
            $(".productGrid").find(".product").css("display", "inline-block");
            $(".productCarousel").find(".productCarousel-slide").css("display", "inline-block");
            $("[catalog-listing-wrap]").show();
            $("[home-catalog-product]").show();
            $(".account-content").show();

            //displayWishlist();
            displayATCBtn();

            if (company_status == "PENDING" || company_status == "REJECTED") {
              nonB2bLoginedinUser();
              $(".navUser-section").prepend(`<li class="navUser-item">
                  <a class="navUser-action" href="${gPartnerLink}">${gPartnerName}</a>
              </li>`);
            } else {
              // data and logic entrance
              $.ajax({
                type: "GET",
                url: `${config.apiRootUrl}/hasSaleRepByEmail?store_hash=${bypass_store_hash}&representative_id=${bypass_email}`,
                success: function(data) {
                  console.log('Is salerep', data);
                  if (data.code == 200 && data.response.count > 0) {
                    const user_info = {
                      "user_id": bypass_customer_id,
                      "role_id": 10
                    };
                    sessionStorage.setItem("bundleb2b_user", JSON.stringify(user_info));

                    if (_callback1) {
                      _callback1();
                    }
                    const hurl = document.referrer;
                    if (hurl.indexOf("/login.php") != -1) {
                      $(".body").remove();
                      window.location.href = "/salerep/";
                    }

                  } else {
                    sessionStorage.removeItem("bundleb2b_sale");
                    displayWishlist();
                    nonB2bLoginedinUser();
                    $(".navUser-section").prepend(`<li class="navUser-item">
                      <a class="navUser-action" href="${gPartnerLink}">${gPartnerName}</a>
                  </li>`);

                  }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log("error", JSON.stringify(jqXHR));
                }
              });

            }
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log("error", JSON.stringify(jqXHR));
        }
      });
    }

    const handleRoleId = function() {
      const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
      console.log(bundleb2b_user);
      if (bundleb2b_user.role_id == "0") {
        // role - junior user
        $("#form-action-addToCart").hide();
        $("#user_shoppinglist_nav").show();
        const hurl = document.referrer;
        if (hurl.indexOf("/login.php") != -1) {
          $(".body").remove();
          //window.location.href = "/dashboard/";
          window.location.href = accountSettingUrl;
        }
      } else if (bundleb2b_user.role_id == "1" || bundleb2b_user.role_id == "2") {
        // role -senior buyer & admin user
        /*$(".navBar--account .navBar-section").prepend(`<li class="navBar-item">
        <a class="navBar-action" href="/dashboard/">Dashboard</a>
    </li>`);*/
        $("#user_management_nav").show();
        $("#user_shoppinglist_nav").show();
        $(".navUser-section").prepend(`<li class="navUser-item navUser-item--quickorder">
            <a class="navUser-action" href="/quick-order-pad/">Quick Order Pad</a>
        </li>`);
        const hurl = document.referrer;
        if (hurl.indexOf("/login.php") != -1) {
          $(".body").remove();
          //window.location.href = "/dashboard/";
          window.location.href = accountSettingUrl;
        }
      } else if (bundleb2b_user.role_id == "10") {
        // role - salerep
        $(".navBar--account .navBar-section").prepend(`<li class="navBar-item">
                <a class="navBar-action" href="/salerep/">Dashboard</a>
            </li>`);

        if (sessionStorage.getItem("bundleb2b_sale")) {
          const saleInfo = JSON.parse(sessionStorage.getItem("bundleb2b_sale"));
          if (saleInfo.company_id) {

            $("#user_shoppinglist_nav").show();
            $(".navUser-section").prepend(`<li class="navUser-item navUser-item--quickorder">
              <a class="navUser-action" href="/quick-order-pad/">Quick Order Pad</a>
          </li>`);
          }
        }

      }

      handleCatalogProducts();
      initCompanyMessage();
      goToPage();

      // if b2b user, remove become a partner link under about us
      $(`.navPage-subMenu-action[href*="${gPartnerLink}"]`).parents("li.navPage-subMenu-item-child").remove();


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

          let base_price = $(`${productSelector}`).find(".price.price--withTax").text().replace("$", "").replace(",", "") || $(`${productSelector}`).find(".price.price--withoutTax").text().replace("$", "").replace(",", "");
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

      $("[b2b-list-add-cart-btn]").each(function() {
        const product_url = $(this).attr("data-product-url");
        $(this).attr("href", product_url).text("View Detail");
      });

      //product Gallery, for listing page
      const $productGallery = $("[b2b-products-gallery]");
      $productGallery.each(function() {
        const catalogProductCount = $(this).find("[catalog-product]").length;
        if (catalogProductCount == 0) {
          //$("[catalog-listing-wrap]").show();
          $("[catalog-listing-wrap]").remove();
          //$(this).parents(".page").html("We can't find products matching the selection.");
        } else {
          $("[catalog-listing-wrap]").show();
          const $catalogProductCounter = $("[data-catalog-product-counter]");
          if ($catalogProductCounter.length > 0) {
            $catalogProductCounter.text(catalogProductCount);
          }
        }
      });

    };

    const initCompanyMessage = function() {
      if (sessionStorage.getItem("bundleb2b_sale")) {
        const salerepInfo = JSON.parse(sessionStorage.getItem("bundleb2b_sale"));
        const company_name = salerepInfo.company_name;
        const company_infobox = salerepInfo.company_infobox;
        //if (company_infobox == "true") {
        $(".navUser").after(`<div class="salerep-infobox"><div class="container" style="overflow:hidden;"><span style="line-height:40px;">Viewing as ${company_name}</span><span class="button button--primary" style="float:right;margin: 0;" end-masquerade>End Masquerade</span></div></div>`);
        /*$("[close-sale-infobox]").unbind("click").bind('click', function() {
          delete salerepInfo.company_infobox;
          sessionStorage.setItem("bundleb2b_sale", JSON.stringify(salerepInfo));
          $(".salerep-infobox").remove();
        });*/
        //}
      }
      $("body").on('click', '[end-masquerade]', function() {
        sessionStorage.removeItem("bundleb2b_sale");
        sessionStorage.removeItem("catalog_id");
        sessionStorage.removeItem("catalog_products");
        const user_info = {
          "user_id": bypass_customer_id,
          "role_id": 10
        };
        sessionStorage.setItem("bundleb2b_user", JSON.stringify(user_info));

        window.location.href = "/salerep/";
      });
    }

    const nonB2bLoginedinUser = () => {
      //company register form
      if (page_templete == 'pages/custom/page/company-register') {
        if (this.context.customer && this.context.customer != null) {
          companyRegistry(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }
      //company register form 2
      if (page_templete == 'pages/custom/page/company-register2') {
        if (this.context.customer && this.context.customer != null) {
          companyRegistry2(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }

    }

    const goToPage = () => {

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


      /*if (page_templete == 'pages/account/orders/all') {
        console.log("enter lists all");

        if (this.context.customer && this.context.customer != null) {
          orderLists(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }*/
      const pageUrl = window.location.href;
      // b2b account setting
      if (pageUrl.indexOf("/account.php?action=account_details") != -1) {
        accountSetting(this.context.customer);
      }

      // b2b order list
      if (pageUrl.indexOf("/account.php?action=order_status") != -1) {
        if (this.context.customer && this.context.customer != null) {
          orderLists(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }

      if (page_templete == 'pages/custom/page/order-detail') {
        if (this.context.customer && this.context.customer != null) {
          orderDetails(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }

      //company register form
      if (page_templete == 'pages/custom/page/company-register') {
        if (this.context.customer && this.context.customer != null) {
          companyRegistry(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }
      //company register form 2
      if (page_templete == 'pages/custom/page/company-register2') {
        if (this.context.customer && this.context.customer != null) {
          companyRegistry2(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }

      //salesrep page
      if (page_templete == 'pages/custom/page/salerep') {
        if (this.context.customer && this.context.customer != null) {
          salerep(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }

      //quick order pad
      if (page_templete == 'pages/custom/page/quick-order-pad') {
        if (this.context.customer && this.context.customer != null) {
          quickOrderPad(this.context.customer);
        } else {
          window.location = this.context.urls.auth.login;
        }
      }
    }

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

    if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
      const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
      if (bypass_customer_id != bundleb2b_user.user_id) {

        sessionStorage.setItem("bundleb2b_user", "none");
        sessionStorage.removeItem("catalog_id");
        sessionStorage.removeItem("catalog_products");
        sessionStorage.removeItem("company_payments");
        sessionStorage.removeItem("bundleb2b_sale");
        console.log("NO sessionStorage bundleb2b_user");
        getUserInfo(function() {
          handleRoleId();
        }, function() {
          handleCatalogProducts();
        });

      } else {
        console.log("sessionStorage bundleb2b_user");
        handleRoleId();
      }

      //get the latest info
      /*setTimeout(function() {
        getUserInfo();
      }, 3000);*/
    } else {
      console.log("NO sessionStorage bundleb2b_user");
      getUserInfo(function() {
        handleRoleId();
      }, function() {
        handleCatalogProducts();
      });
    }

  } else {
    // not logined in , normal customer
    $(".productGrid").find(".product").css("display", "inline-block");
    $(".productCarousel").find(".productCarousel-slide").css("display", "inline-block");
    $("[catalog-listing-wrap]").show();
    $("[home-catalog-product]").show();
    sessionStorage.setItem("bundleb2b_user", "none");
    sessionStorage.removeItem("catalog_id");
    sessionStorage.removeItem("catalog_products");
    sessionStorage.removeItem("company_payments");
    sessionStorage.removeItem("bundleb2b_sale");

    // not logined in , navigation to login pae
    const page_templete = this.context.page_templete.replace(/\\/g, '/');
    console.log(page_templete);
    if (page_templete == 'pages/custom/page/shopping-lists') {
      window.location = this.context.urls.auth.login;
    }
    if (page_templete == 'pages/custom/page/shopping-list') {
      window.location = this.context.urls.auth.login;
    }
    if (page_templete == 'pages/custom/page/user-management') {
      window.location = this.context.urls.auth.login;
    }
    //company register form
    if (page_templete == 'pages/custom/page/company-register') {
      window.location = this.context.urls.auth.login;
    }
    //company register form 2
    if (page_templete == 'pages/custom/page/company-register2') {
      $(".company-form-wrap2").empty();
      return swal({
        allowOutsideClick: false,
        type: "info",
        text: 'Please login first.'
      }).then(() => {
        window.location = this.context.urls.auth.login;
      });

    }

    //salesrep page
    if (page_templete == 'pages/custom/page/salerep') {
      window.location = this.context.urls.auth.login;
    }

    //quick order pad
    if (page_templete == 'pages/custom/page/quick-order-pad') {
      window.location = this.context.urls.auth.login;
    }

  }


}