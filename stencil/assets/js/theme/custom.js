import $ from 'jquery';

$(document).ready(function() {
	$('.quickSearchResults').on('click', '.modal-close', function() {
		$('.quickSearchResults *').remove();
	});
	$('.scroll-to-top').click(function() {
		event.preventDefault();
		$('html,body').animate({scrollTop: 0}, 1000);
	});
    $('body').on('cart-quantity-update', (event, quantity) => {
        if(quantity == 1) {
            $('.cart-quantity').html('<span class="cart-quantity-number">' + quantity + '</span> item');
        } else {
            $('.cart-quantity').html('<span class="cart-quantity-number">' + quantity + '</span> items');
        }
    });
});
/* Custom Mobile */
$(document).ready(function() {
	var running = false;
	/* When click on parent dropdown */
	$('.navPages-main-content').on("click", '.navPages-action.has-subMenu', function() {
		event.preventDefault();
		if($(window).width() < 768) {
			if(!running) {
				running = true;
				var a = $(this).parent('li'),
					b = $.trim(a.children('a').text()),
					c = a.children('.navPage-subMenu').html(),
					go_back = '<i class="icon nav-subhead" aria-hidden="true"><svg><use xlink:href="#icon-chevron-left" /></svg></i>',
					final_content = '<div class="subnav-container"><div class="subnav-header"><h2>' + go_back + b + '</h2></div><div class="subnav-content">' + c + '</div>';
				$('.navPages-main-content').append(final_content);
				$('.subnav-container').animate({
					'left': 0
				}, 300);
				running = false;
			}
		}
	});
	$('.navPages-main-content').on("click", '.subnav-header', function(event) {
		var a = $(this).parent('.subnav-container');
		a.animate({
			'left': '100%'
		}, 300);
		setTimeout(function() {
			a.remove();
		}, 400);
	});
	$('.navPages-container').on('click', '.mobile-overlay', function() {
		$('.mobile-nav-close .mobileMenu-toggle').click();
		$('.navPages-main-content .subnav-container').remove();
	});
	$(window).resize(function() {
		if($(window).width() >= 768) {
			console.log($('.navPages-main-content .subnav-container').length);
			if($('.navPages-main-content .subnav-container').length > 0) {
				$('.mobile-nav-close .mobileMenu-toggle').click();
				$('.navPages-main-content .subnav-container').remove();
			}
		}
	});
});
