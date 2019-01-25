import $ from 'jquery';
import nod from '../common/nod';
import validation from '../common/form-validation';
import forms from '../common/models/forms';
import swal from 'sweetalert2';
import config from './config';

export default function(customer) {
	console.log("company registry js");

	const bypass_store_hash = `${config.storeHash}`;
	const bypass_email = customer.email;
	const bypass_customer_id = customer.id;

	//const companyPending = "PENDING";

	const companyFormSelector = `[data-create-company-form]`;
	const $companyForm = $("[data-create-company-form]");
	const $companyFormSubmitBtn = $companyForm.find("input[type=submit]");
	const $companyFormParent = $companyForm.parent();

	//form validate
	let newCompanyValidator = nod({
		button: `${companyFormSelector} input[type="submit"]`,
	});

	newCompanyValidator.add([{
		selector: `${companyFormSelector} input[name="company_name"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_website"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_address_street"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "Please enter a valid email.",
	}, {
		selector: `${companyFormSelector} input[name="company_address_city"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_address_state"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_address_zip"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_user_firstName"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_user_lastName"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_user_phone"]`,
		validate: (cb, val) => {
			const result = val.length;
			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${companyFormSelector} input[name="company_user_email"]`,
		validate: (cb, val) => {
			const result = forms.email(val);
			cb(result);
		},
		errorMessage: "Please enter a valid email.",
	}]);

	$companyForm.on("submit", (event) => {
		event.preventDefault();

		newCompanyValidator.performCheck();
		if (newCompanyValidator.areAll('valid')) {
			//ajax submit form
			const company_id = $("#company_id", $companyForm).val();
			const company_customer_id = $("#company_customer_id", $companyForm).val();
			const company_customer_role = $("#company_customer_role", $companyForm).val();
			const company_name = $("#company_name", $companyForm).val();
			const company_business_type = $("#company_business_type", $companyForm).val();
			const company_website = $("#company_website", $companyForm).val();
			const company_address_street = $("#company_address_street", $companyForm).val();
			const company_address_city = $("#company_address_city", $companyForm).val();
			const company_address_state = $("#company_address_state", $companyForm).val();
			const company_address_zip = $("#company_address_zip", $companyForm).val();
			const company_tax_id = $("#company_tax_id", $companyForm).val();
			const company_user_firstName = $("#company_user_firstName", $companyForm).val();
			const company_user_lastName = $("#company_user_lastName", $companyForm).val();
			const company_user_phone = $("#company_user_phone", $companyForm).val();
			const company_user_email = $("#company_user_email", $companyForm).val();



			if ($companyFormSubmitBtn.attr("data-submit-type") && $companyFormSubmitBtn.attr("data-submit-type") == "resubmit") {
				//update company info
				const update_postData = {
					"id": company_id,
					"store_hash": bypass_store_hash,
					"company_name": company_name,
					"manager_info": {
						"first_name": company_user_firstName,
						"last_name": company_user_lastName
					},
					"customers": [{
						"role": company_customer_role,
						"id": company_customer_id
					}],
					"business_type": company_business_type,
					"web_site": company_website,
					"city": company_address_city,
					"zip_code": company_address_zip,
					"address": company_address_street,
					"tax_no": company_tax_id,
					"email": company_user_email,
					"phone": company_user_phone,
					"country_state": company_address_state
				};
				console.log(update_postData);
				//return;

				$.ajax({
					type: "POST",
					url: `${config.apiRootUrl}/company`,
					data: JSON.stringify(update_postData),
					success: function(data) {
						console.log("after created company:", data);
						if (data && data.id) {
							const comapnyId = data.id;


							//update company status
							const putData = {
								"store_hash": bypass_store_hash,
								"company_status": "PENDING",
								"id": comapnyId
							};
							console.log(putData);
							//return;


							$.ajax({
								type: "PUT",
								url: `${config.apiRootUrl}/companyStatus`,
								data: JSON.stringify(putData),
								success: function(data) {
									//console.log("after created company:", data);

									swal({
										type: 'success',
										text: "Your application has been resubmitted successfully. \nPlease waiting for approval.",
										showCancelButton: false,
									});
									window.location.reload();

								},
								error: function(jqXHR, textStatus, errorThrown) {
									console.log("error", JSON.stringify(jqXHR));
								}
							});

						}

					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("error", JSON.stringify(jqXHR));
					}
				});
			} else {
				//apply new company
				const postData = {
					"store_hash": bypass_store_hash,
					"company_name": company_name,
					"manager_info": {
						"first_name": company_user_firstName,
						"last_name": company_user_lastName
					},
					"business_type": company_business_type,
					"web_site": company_website,
					"city": company_address_city,
					"zip_code": company_address_zip,
					"address": company_address_street,
					"tax_no": company_tax_id,
					"email": company_user_email,
					"phone": company_user_phone,
					"country_state": company_address_state,
					"customer_id": bypass_customer_id
				};
				console.log(postData);
				//return;

				$.ajax({
					type: "POST",
					url: `${config.apiRootUrl}/company`,
					data: JSON.stringify(postData),
					success: function(data) {
						console.log("after created company:", data);


						swal({
							type: 'success',
							text: "Your application has been submitted successfully. \nPlease waiting for approval.",
							showCancelButton: false,
						});
						window.location.reload();



					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("error", JSON.stringify(jqXHR));
					}
				});

			}



		} else {
			return;
		}
	});


	//INIT PAGE
	$.ajax({
		type: "GET",
		url: `${config.apiRootUrl}/company?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`,
		success: function(data) {
			console.log("get company users:", data);
			if (data && JSON.stringify(data) != "{}") {
				const company_id = data.id;
				const company_status = data.company_status;

				if (company_status == "PENDING") {
					$companyFormParent.html(`<p style="margin-bottom:0.75rem;">Company application status: ${company_status}</p>Your application is under review, please wait...`);

				} else if (company_status == "APPROVED") {
					$companyFormParent.html("You are already in company");
					window.location.href = "/";

				} else if (company_status == "REJECTED") {
					$companyForm.show();
					$companyFormSubmitBtn.val("RESUBMIT APPLICATION").attr("data-submit-type", "resubmit");
					$companyFormParent.prepend(`<p style="margin-bottom:0.75rem;">Company application status: ${company_status}</p>Your application has been rejected, you can resubmit your application.`);


					//hidden fields
					$("#company_id", $companyForm).val(data.id);
					$("#company_customer_role", $companyForm).val(data.customers[0].role);
					$("#company_customer_id", $companyForm).val(data.customers[0].id);

					if (data.company_name) {
						$("#company_name", $companyForm).val(data.company_name);
					}
					if (data.business_type) {
						$("#company_business_type", $companyForm).val(data.business_type);
					}
					if (data.web_site) {
						$("#company_website", $companyForm).val(data.web_site);
					}
					if (data.address) {
						$("#company_address_street", $companyForm).val(data.address);
					}
					if (data.city) {
						$("#company_address_city", $companyForm).val(data.city);
					}
					if (data.country_state) {
						$("#company_address_state", $companyForm).val(data.country_state);
					}
					if (data.zip_code) {
						$("#company_address_zip", $companyForm).val(data.zip_code);
					}
					if (data.tax_no) {
						$("#company_tax_id", $companyForm).val(data.tax_no);
					}
					if (data.manager_info && data.manager_info.first_name) {
						$("#company_user_firstName", $companyForm).val(data.manager_info.first_name);
					}
					if (data.manager_info && data.manager_info.last_name) {
						$("#company_user_lastName", $companyForm).val(data.manager_info.last_name);
					}
					if (data.phone) {
						$("#company_user_phone", $companyForm).val(data.phone);
					}
					if (data.email) {
						$("#company_user_email", $companyForm).val(data.email);
					}

				}


			} else {
				$companyForm.show();
			}

		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("error", JSON.stringify(jqXHR));
		}
	});



}