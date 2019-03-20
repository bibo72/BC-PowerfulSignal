import nod from '../common/nod';
import validation from '../common/form-validation';
import forms from '../common/models/forms';
import config from './config';

export default function(customer) {

	//store hash
	const bypass_store_hash = `${config.storeHash}`;
	//login user
	//const bypass_email = "bibo72@outlook.com";

	const bypass_email = customer.email;
	const bypass_customer_id = customer.id;
	let gRoleId = "";
	let bypass_company_id;
	let email_staus = ''

	const $showActiveUsersBtn = $("#show_active_users");
	const $showInactiveUsersBtn = $("#show_inactive_users");
	const $showAllUsersBtn = $("#show_all_users");
	const $userTable = $("#user_management_table");
	const $newUserModal = $("#modal-user-management-new-form");
	const $editUserModal = $("#modal-user-management-edit-form");

	const $overlay = $("#b2b_loading_overlay");

	const load_table = function() {
		$overlay.show();
		$.ajax({
			type: "GET",
			url: `${config.apiRootUrl}/company?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`,
			success: function(data) {
				$overlay.hide();

				$userTable.find("tbody").html("");

				if (gRoleId == 2) {
					const thead = `<tr>
		    		    <th>Name</th>
		    		    <th>Email</th>
		    		    <th>Role</th>
		    		</tr>`;

					$userTable.find("thead").html(thead);
				}

				if (data.customers) {
					const usersdata = data.customers;
					for (let i = 0; i < usersdata.length; i++) {
						const userdata = usersdata[i];
						let role = userdata.role;
						if (userdata.role == 1) {
							role = "Admin";

						} else if (userdata.role == 2) {
							role = "Senior Buyer";
						} else if (userdata.role == 0) {
							role = "Junior Buyer";
						}

						let tr = "";
						if (gRoleId == 1) {
							tr = `<tr data-user='${JSON.stringify(userdata)}'>
				    			<td><span class="mobile-td-lable">Name:</span>${userdata.first_name} ${userdata.last_name}</td>
				    			<td><span class="mobile-td-lable">Email:</span>${userdata.email}</td>
				    			<td><span class="mobile-td-lable">Role:</span>${role}</td>
				    			<td class="actions-field t-align-r">
				    			    <a href="#" data-reveal-id="modal-user-management-edit-form" class="button button--primary button--small" data-edit-user>Edit</a>
				    			    <span class="actions-split">|</span>
				    			    <a href="#" data-delete-user class="button button--small">Delete</a></td>
				    		</tr>`;

						} else if (gRoleId == 2) {
							tr = `<tr data-user='${JSON.stringify(userdata)}'>
				    			<td><span class="mobile-td-lable">Name:</span>${userdata.first_name} ${userdata.last_name}</td>
				    			<td><span class="mobile-td-lable">Email:</span>${userdata.email}</td>
				    			<td><span class="mobile-td-lable">Role:</span>${role}</td>
				    		</tr>`;

						}

						$userTable.find("tbody").append(tr);
					}

					$("#num_items").text($userTable.find("tbody tr").length);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log(JSON.stringify(jqXHR));
			}
		});
	}

	// close the modal
	$newUserModal.find(".modal-close").on('click', function() {
		console.log('close the modal')
		console.log('lo', $newUserModal.find('form').eq(0)[0])
		// reset data
		$newUserModal.find('form').eq(0)[0].reset()
		// reset style
		var cd = $newUserModal.find('.form-fieldset').eq(0).children().removeClass('form-field--error').removeClass('form-field--success')
		let fields = $newUserModal.find('.form-fieldset').eq(0).children()
		fields.find('span').css({
			display: 'none'
		})
	})

	const handleRoleId = function() {
		const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
		gRoleId = bundleb2b_user.role_id;
		bypass_company_id = bundleb2b_user.company_id;

		if (gRoleId == "1") {
			load_table();

		} else if (gRoleId == "2") {
			$(".toolbar-actions").remove();
			load_table();

		} else {
			alert("You have no access to this page.");
			window.location.href = "/account.php";

		}
	}
	const checkCustomerEmail = function(email) {
		let promise = new Promise((resolve, reject) => {
			$.ajax({
				type: 'GET',
				url: `${config.apiRootUrl}/checkCustomerEmail?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}&company_id=${bypass_company_id}&email=${email}`,
				success: function(data) {
					let staus = data.code;
					resolve(staus)
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.log(JSON.stringify(jqXHR));
				}
			})
		})
		return promise

	}
	const getUserInfo = function(_callback) {
		$.ajax({
			type: "GET",
			url: `${config.apiRootUrl}/company?store_hash=${bypass_store_hash}&customer_id=${bypass_customer_id}`,
			success: function(data) {
				if (data && data != null) {
					const userList = data.customers;
					const company_id = data.id;
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
				}
				if (_callback) {
					_callback();
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(JSON.stringify(jqXHR));
			}
		});

	}

	var interval = setInterval(function() {
		if (sessionStorage.getItem("bundleb2b_user")) {
			clearInterval(interval);
			const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
			gRoleId = bundleb2b_user.role_id;
			bypass_company_id = bundleb2b_user.company_id;

			if (gRoleId == "1") {
				load_table();

			} else if (gRoleId == "2") {
				$(".toolbar-actions").remove();
				load_table();

			} else {
				alert("You have no access to this page.");
				window.location.href = "/account.php";

			}
		}
	}, 100);


	let newUserValidator = nod({
		button: '#modal-user-management-new-form form input[type="button"]',
	});

	const newUserFormSelector = `#modal-user-management-new-form form`;
	// checkFunction for add user email
	// nod.checkFunctions['validateEmail'] = function (event){
	// 	console.log('时间',event)
	// 	return function(callback,value){
	// 		if(!(forms.email(value))){
	// 			callback(false)
	// 		}else{
	// 			checkCustomerEmail(value).then((status)=> {
	// 				if(status === 0){
	// 					email_staus = 0
	// 					callback(true)
	// 				}else if(status == 1){
	// 					email_staus = 1
	// 					newUserValidator.remove(`${newUserFormSelector} input[name="email"]`)
	// 				}else if(status==2){
	// 					email_staus = 2
	// 					callback(false)
	// 					newUserValidator.remove(`${newUserFormSelector} input[name="email"]`)
	// 				}

	// 			})
	// 		}
	// 	}
	// }

	newUserValidator.add([{
			selector: `${newUserFormSelector} input[name="first_name"]`,
			validate: (cb, val) => {
				const result = val.length;
				cb(result);
			},
			errorMessage: "This field can't be null.",
		}, {
			selector: `${newUserFormSelector} input[name="last_name"]`,
			validate: (cb, val) => {
				const result = val.length;
				cb(result);
			},
			errorMessage: "This field can't be null.",
		},
		// {
		// 	selector: `${newUserFormSelector} input[name="email"]`,
		// 	validate: (cb, val) => {
		// 		const result = forms.email(val);
		// 		cb(result);
		// 	},
		// 	validate: 'validateEmail',
		// 	errorMessage: email_staus==2 ?  "a user with this email address already exists in the system ":'eeerrrre',
		// }, 
		{
			selector: `${newUserFormSelector} input[name="phone"]`,
			validate: (cb, val) => {
				//const result = forms.phone(val);
				const result = val.length;
				cb(result);
			},
			errorMessage: "This field can't be empty.",
		}, {
			selector: `${newUserFormSelector} input[name="status"]`,
			validate: (cb, val) => {
				const result = val.length;
				cb(result);
			},
			errorMessage: "This field can't be empty.",
		}, {
			selector: `${newUserFormSelector} input[name="last_name"]`,
			validate: (cb, val) => {
				const result = val.length;
				cb(result);
			},
			errorMessage: "This field can't be empty.",
		},
	]);

	// clear email-input style,just a input reset function
	const resetEmail = function(status, prompt) {
		email_staus = status
		let nodeEmail = $(`${newUserFormSelector} input[name="email"]`);
		nodeEmail.parent().removeClass('form-field--error')
		nodeEmail.parent().removeClass('form-field--success')
		nodeEmail.next().removeClass('form-inlineMessage')
		nodeEmail.next().css({
			display: 'none'
		})
		if (prompt) {
			nodeEmail.next().html(prompt)
		}


	}

	$(`${newUserFormSelector} input[name="email"]`).on('change', function(event) {
		let nodeEmail = $(`${newUserFormSelector} input[name="email"]`)
		console.log('event', nodeEmail.val())
		let val = nodeEmail.val()
		var pattern = /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i;
		var verify = pattern.test(val)
		if (verify) {
			checkCustomerEmail(val).then((status) => {
				let prompt = ''
				// record status and handle dom
				switch (status) {
					case 200:
						email_staus = 0
						resetEmail(0);
						nodeEmail.parent().addClass('form-field--success');
						break;
					case 1001:
						email_staus = 0
						prompt = 'You have one accout in bc and we will create a account in system'
						resetEmail(0, prompt)
						nodeEmail.next().css({
							display: 'inline',
							'margin-top': '5px'
						})
						nodeEmail.next().addClass('form-inlineMessage')
						break;
					case 1002:
						prompt = 'A user with this email address already exists in the system'
						resetEmail(status, prompt)
						nodeEmail.parent().addClass('form-field--error')
						nodeEmail.next().css({
							display: 'inline',
							'margin-top': '5px'
						})
						nodeEmail.next().addClass('form-inlineMessage')
						break;
					case 1003:
						prompt = 'Your company is not approved!';
						resetEmail(status, )
						nodeEmail.parent().addClass('form-field--error')
						nodeEmail.next().css({
							display: 'inline',
							'margin-top': '5px'
						})
						nodeEmail.next().addClass('form-inlineMessage')
						break;
					case 1004:
						prompt = "Don't have permission or not a admin"
						resetEmail(4, prompt)
						nodeEmail.parent().addClass('form-field--error')
						nodeEmail.next().html('Please enter a legitimate e-mail!')
						nodeEmail.next().css({
							display: 'inline',
							'margin-top': '5px'
						})
						nodeEmail.next().addClass('form-inlineMessage')
						break;
				}
				// if(status == 0){
				// 	email_staus = 0
				// 	resetEmail(0)
				// 	nodeEmail.parent().addClass('form-field--success')
				// }else if(status == 2){
				// 	let prompt = 'a user with this email address already exists in the system'
				// 	resetEmail(status,prompt)
				// 	nodeEmail.parent().addClass('form-field--error')
				// 	nodeEmail.next().css({display:'inline','margin-top':'5px'})
				// 	nodeEmail.next().addClass('form-inlineMessage')
				// }else if(status == 1){
				// 	const prompt = 'you have one accout in bc and we will create a account in system'
				// 	resetEmail(status,prompt)
				// 	nodeEmail.next().css({display:'inline','margin-top':'5px'})
				// 	nodeEmail.next().addClass('form-inlineMessage')
				// }else if(status == 3){
				// 	const prompt = 'your company is not approved!';
				// 	resetEmail(status,)
				// 	nodeEmail.parent().addClass('form-field--error')
				// 	nodeEmail.next().css({display:'inline','margin-top':'5px'})
				// 	nodeEmail.next().addClass('form-inlineMessage')
				// }else{
				// 	const prompt = "don't have permission or not a admin"
				// 	resetEmail(4,prompt)
				// 	nodeEmail.parent().addClass('form-field--error')
				// 	nodeEmail.next().html('please enter a legitimate e-mail!')
				// 	nodeEmail.next().css({display:'inline','margin-top':'5px'})
				// 	nodeEmail.next().addClass('form-inlineMessage')
				// }
			})
		} else {
			let status = ''
			const prompt = 'please enter a legitimate e-mail!'
			resetEmail(status, prompt)
			nodeEmail.parent().addClass('form-field--error')
			nodeEmail.next().css({
				display: 'inline',
				'margin-top': '5px'
			})
			nodeEmail.next().addClass('form-inlineMessage')
		}



	})

	//save new user
	$("#save_new_user").on('click', function() {
		newUserValidator.performCheck();
		console.log('check_',email_staus)
		if (newUserValidator.areAll('valid') && email_staus == 0) {} else {
			return;
		}

		const $form = $(this).parents("form");
		const first_name = $("#first_name", $form).val();
		const last_name = $("#last_name", $form).val();
		const email = $("#email", $form).val();
		const phone = $("#phone", $form).val();
		const role_id = $("#role_id", $form).val();

		const userData = {
			"first_name": first_name,
			"last_name": last_name,
			"email": email,
			"phone": phone,
			"role": role_id

		};
		console.log(userData);
		$overlay.show();

		$.ajax({
			type: "POST",
			url: `${config.apiRootUrl}/customer?store_hash=${bypass_store_hash}&company_id=${bypass_company_id}&customer_id=${bypass_customer_id}`,
			data: JSON.stringify(userData),
			success: function(data) {
				console.log(data);
				if (data) {
					if (data.emailTaken) {
						$overlay.hide();
						alert("The email you entered has already exist, please enter another email.");

					} else {
						$newUserModal.find(".modal-close").eq(0).click();
						load_table();
					}

				}

			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log(JSON.stringify(jqXHR));
			}
		});

	});

	//open edit user modal
	$userTable.on('click', "[data-edit-user]", (event) => {
		const $target = $(event.target);
		const $form = $editUserModal.find("form");
		const userData = $target.parents("tr").attr("data-user");
		const userDataJson = $.parseJSON(userData);
		console.log(userDataJson);
		$("#first_name", $form).val(userDataJson.first_name);
		$("#last_name", $form).val(userDataJson.last_name);
		$("#email", $form).val(userDataJson.email);
		$("#phone", $form).val(userDataJson.phone);
		$("#role_id", $form).val(userDataJson.role);
		//$("#status", $form).val(userDataJson.status);
		$("#user_id", $form).val(userDataJson.id);
		//$editUserModal
	});

	let updateUserValidator = nod({
		button: '#modal-user-management-edit-form form input[type="button"]',
	});

	const updateUserFormSelector = `#modal-user-management-edit-form form`;

	updateUserValidator.add([{
		selector: `${updateUserFormSelector} input[name="first_name"]`,
		validate: (cb, val) => {
			const result = val.length;

			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${updateUserFormSelector} input[name="last_name"]`,
		validate: (cb, val) => {
			const result = val.length;

			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${updateUserFormSelector} input[name="email"]`,
		validate: (cb, val) => {
			const result = forms.email(val);
			cb(result);
		},
		errorMessage: "Please enter a valid email.",
	}, {
		selector: `${updateUserFormSelector} input[name="phone"]`,
		validate: (cb, val) => {
			const result = val.length;

			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${updateUserFormSelector} input[name="status"]`,
		validate: (cb, val) => {
			const result = val.length;

			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, {
		selector: `${updateUserFormSelector} input[name="last_name"]`,
		validate: (cb, val) => {
			const result = val.length;

			cb(result);
		},
		errorMessage: "This field can't be null.",
	}, ]);

	//update user
	$("#update_user").on("click", function() {
		updateUserValidator.performCheck();
		if (updateUserValidator.areAll('valid')) {

		} else {
			return;
		}

		const $form = $(this).parents("form");
		const user_id = $("#user_id", $form).val();
		const first_name = $("#first_name", $form).val();
		const last_name = $("#last_name", $form).val();
		const email = $("#email", $form).val();
		const phone = $("#phone", $form).val();
		const role_id = $("#role_id", $form).val();


		const userData = {
			"id": user_id,
			"first_name": first_name,
			"last_name": last_name,
			"email": email,
			"phone": phone,
			"role": role_id
		};

		console.log(userData);
		$overlay.show();

		$.ajax({
			type: "PUT",
			url: `${config.apiRootUrl}/customer?store_hash=${bypass_store_hash}&company_id=${bypass_company_id}`,
			data: JSON.stringify(userData),
			success: function(data) {
				console.log(data);
				$editUserModal.find(".modal-close").eq(0).click();
				load_table();

			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log(JSON.stringify(jqXHR));
			}
		});

	});

	$userTable.on('click', "[data-delete-user]", (event) => {

		if (confirm("Are you sure you want to delete this user?") == false) {
			return;
		}
		const $target = $(event.target);
		const userDate = $target.parents("tr").attr("data-user");
		const user_id = JSON.parse(userDate).id;

		$overlay.show();

		$.ajax({
			type: "DELETE",
			url: `${config.apiRootUrl}/customer?store_hash=${bypass_store_hash}&company_id=${bypass_company_id}&customer_id=${user_id}`,
			success: function(data) {
				console.log("delete user response data", data);
				load_table();

			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log("error", JSON.stringify(jqXHR));
			}
		});

	});


}
