import $ from 'jquery';

$('.change-grid').click(function(event) {
	event.preventDefault();
	if($(this).hasClass('active-prods')) {
		return;
	}
	$('.change-list').removeClass('active-prods');
	$(this).addClass('active-prods');
	$('.productList').addClass('productGrid');
	var h = 0;
	$('.productGrid .product').each(function() {
		var th = $(this).height();
		if(th > h) {
			h = th;
		}
	});
	$('.productGrid .product .listItem').css('min-height', h);
	$('.productGrid .product .listItem-buttons').addClass('absolute-buttons');
});
$('.change-list').click(function(event){
	event.preventDefault();
	$('.change-grid').removeClass('active-prods');
	$('.productList').removeClass('productGrid');
	$(this).addClass('active-prods');
	$('.productList .product .listItem').css('min-height','1px');
	$('.productList .product .listItem').css('height','auto');
});
$(document).resize(function() {
	var h = 0;
	$('.productGrid .product').each(function() {
		var th = $(this).height();
		console.log(th);
		if(th > h) {
			h = th;
		}
	});
	console.log('max: ' + h);
});
