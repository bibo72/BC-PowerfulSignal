import $ from 'jquery';

var retrieveBrandLogoForProductPage = {
	init: function(){
		this.ajaxFetchBrandsPageData();
	},
	ajaxFetchBrandsPageData: function(){
		$.ajax({
			url: '/brands'
		}).done(function(data){
			retrieveBrandLogoForProductPage.fetchBrandImageUrlFromBrandsPageData(data);
		});
	},
	fetchBrandImageUrlFromBrandsPageData: function(data){
		var $productPageBrandUrl = $('.productView-brand > a').attr('href');
		var $brandPageBrandItem = $(data).find('.brandGrid li');
		$brandPageBrandItem.each(function(){
			var $this = $(this);
			var $brandPageBrandUrl = $($this).find('a').attr('href');
			if($brandPageBrandUrl === $productPageBrandUrl){
				var $brandPageBrandImgSrcUrl = $($this).find('a > img').attr('src');
				retrieveBrandLogoForProductPage.renderBrandImageToProductPage($brandPageBrandImgSrcUrl);
			}
		});
	},
	renderBrandImageToProductPage: function(brandPageBrandImgSrcUrl){
		var $elementToAppendImageToOnProductPage = $('.productView-brand a');
		var $removeTheTextFromTheElementtoAppendTo = $elementToAppendImageToOnProductPage.empty();
		var $brandImgElement = '<img src="' + brandPageBrandImgSrcUrl + '">';
		$($brandImgElement).appendTo($elementToAppendImageToOnProductPage);
	}
};
$(document).ready(function() {
	retrieveBrandLogoForProductPage.init();
	/* add to cart on right side */
	$('.add-to-cart-right').on('click', function() {
		var a = $(this).attr('value'), b = $(this).attr('data-wait-message');
		$(this).attr('value', b);
		$('.productView-options #form-action-addToCart').click();
		setTimeout(function() {
			$('.add-to-cart-right').attr('value', a);
		}, 1000);
	});
});
$(document).ready(function() {
	$('.productView-description > .tabs .tab .tab-title').on('click',function(event) {
		var a = $(this).attr('href').toString();
		event.preventDefault();
		var b = $(a).offset().top;
		$('html,body').animate({scrollTop: (b-160)}, 1000);
	});
	/* add more information tab */
	if($('.more-information').length > 0) {
		var a = '<li class="tab"><a class="tab-title" href="#tab-info">More Information</a></li>',
			b = $('.more-information').html(),
			c = '<div class="tab-content" id="tab-info"><p class="productView-title">More Information</p>' + b + '</div>';
		$('.more-information').remove();
		$('.more-info-tab').show();
		$('#tab-info').html(b).show();
	}
});
