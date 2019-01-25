import config from './config';
import swal from 'sweetalert2';

export default function(customer) {
	//store hash
	const bypass_store_hash = `${config.storeHash}`;
	//login user
	//const bypass_email = "bibo72@outlook.com";
	const bypass_email = customer.email;
	let bypass_company_id;
	const bypass_customer_id = customer.id;

	const gListStatus = {
		"0": "Approved",
		"20": "Deleted",
		"30": "Draft",
		"40": "Ready for Approval",
	};
	let gRoleId = "";
	const $overlay = $("#b2b_loading_overlay");

	//const $shoppingListForm = ;
	const $newShoppingListModal = $("#modal-shopping-list-new-form");
	const $shoppingListsTable = $("#shopping_lists_table");


	//status switch
	const $statusSwitchBtn = $("[filter-status]");
	$statusSwitchBtn.on("click", function(event) {
		event.preventDefault();

		$(this).hide().siblings("[filter-status]").show();
		const status = $(this).attr("data-status-value");

		$shoppingListsTable.attr("css-status", status);
		if (status == "all") {
			const allnum = $shoppingListsTable.find("tbody tr").length;
			$("#num_items").text(allnum);
		} else {
			const currentStatusNum = $shoppingListsTable.find(`tbody tr[data-status="${status}"]`).length;
			$("#num_items").text(currentStatusNum);
		}

	});

	const load_table = function() {
		$shoppingListsTable.find("tbody").html("");
		$overlay.show();

		if (gRoleId == "1" || gRoleId == "2" || gRoleId == "10") {
			$shoppingListsTable.find("thead").html(`<tr>
		    		    <th>Name &amp; Description</th>
		    		    <th>Created By</th>
		    		    <th class="t-align-r">Items</th>
		    		    <th>Latest Activity</th>
		    		    <th>Status</th>
		    		    <th class="t-align-r">Action</th>
		    		</tr>`);

		} else {
			$shoppingListsTable.find("thead").html(`<tr>
		    		    <th>Name &amp; Description</th>
		    		    <th class="t-align-r">Items</th>
		    		    <th>Latest Activity</th>
		    		    <th>Status</th>
		    		    <th class="t-align-r">Action</th>
		    		</tr>`);
		}

		$.ajax({
			type: "GET",
			url: `${config.apiRootUrl}/requisitionlist?store_hash=${bypass_store_hash}&company_id=${bypass_company_id}&customer_id=${bypass_customer_id}`,
			success: function(data) {
				console.log("list Shopping lists", data);
				$overlay.hide();

				if (data) {
					if (data.length > 0) {
						const listsData = data;
						for (let i = 0; i < listsData.length; i++) {
							const listData = listsData[i];
							let listItemNum = 0;
							let latestDate = listData.created_date;
							let createBy = "";
							let comment = "";

							if (listData.description) {
								comment = listData.description;
							}

							if (listData.customer_info) {
								if (listData.customer_info.first_name) {
									createBy = `${listData.customer_info.first_name} `;
								}
								if (listData.customer_info.last_name) {
									createBy += listData.customer_info.last_name;
								}

							}



							if (listsData[i].products) {
								listItemNum = listsData[i].products.length;

							}
							if (listData.updated_date) {
								latestDate = listData.updated_date;
							}
							const d_year = latestDate.substring(0, 4);
							const d_month = latestDate.substring(5, 7);
							const d_date = latestDate.substring(8, 10);
							latestDate = `${d_month}/${d_date}/${d_year}`;

							//if (listData.status != "10") {
							let tr;
							let ths;

							if (gRoleId == 1 || gRoleId == 2 || gRoleId == 10) {
								if (listData.status != "30") {
									tr = `<tr data-status="${listData.status}" data-list="${JSON.stringify(listsData[i])}">
				    			<td>
				    				<div class="cell-line-name">${listData.name}</div>
				    				<div class="cell-line-description">${comment}</div>
				    			</td>
				    			<td><span class="mobile-td-lable">Created By:</span>${createBy}</td>
				    			<td class="t-align-r"><span class="mobile-td-lable">Items:</span>${listItemNum}</td>
				    			<td><span class="mobile-td-lable">Latest Activity:</span>${latestDate}</td>
				    			<td><span class="mobile-td-lable">Status:</span>${gListStatus[listData.status] ||""}</td>
				    			<td class="t-align-r actions-field"><a class="button button--primary button--small" href="/shopping-list/?list_id=${listData.id}">View</a></td>
				    		</tr>`;
								}

							} else {
								tr = `<tr data-status="${listData.status}" data-list="${JSON.stringify(listsData[i])}">
				    			<td>
				    				<div class="cell-line-name">${listData.name}</div>
				    				<div class="cell-line-description">${comment}</div>
				    			</td>
				    			<td class="t-align-r"><span class="mobile-td-lable">Items:</span>${listItemNum}</td>
				    			<td><span class="mobile-td-lable">Latest Activity:</span>${latestDate}</td>
				    			<td><span class="mobile-td-lable">Status:</span>${gListStatus[listData.status] || ""}</td>
				    			<td class="t-align-r actions-field"><a class="button button--primary button--small" href="/shopping-list/?list_id=${listData.id}">View</a></td>
				    		</tr>`;

							}

							$shoppingListsTable.find("tbody").append(tr);

							//}

						}

					}

					//$("#num_items").text($shoppingListsTable.find("tbody tr").length);

					if ($shoppingListsTable.attr("css-status") == "all") {
						const allnum = $shoppingListsTable.find("tbody tr").length;
						$("#num_items").text(allnum);
					} else {
						const currentStatusNum = $shoppingListsTable.find(`tbody tr[data-status="${status}"]`).length;
						$("#num_items").text(currentStatusNum);
					}

				}

			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log("error", JSON.stringify(jqXHR));
			}
		});
	}

	//page loading...
	var interval = setInterval(function() {
		if (sessionStorage.getItem("bundleb2b_user")) {
			clearInterval(interval);
			if (sessionStorage.getItem("bundleb2b_user") == "none") {
				window.location.href = "/";
				return;
			}
			const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
			gRoleId = bundleb2b_user.role_id;
			bypass_company_id = bundleb2b_user.company_id;

			if (gRoleId == 1 || gRoleId == 2) {
				$("#show_status_30").remove();
			}
			if (gRoleId == 10) {
				$("#show_status_30").remove();
				if (!bypass_company_id) {
					window.location.href = "/salerep/";
					return swal({
						type: "error",
						text: 'Please choose a company on "Dashboard".'
					});

				}

			}
			if (gRoleId != "") {
				load_table();
			} else {
				alert("User Not Exist.");
				return;
			}
		}
		//console.log("loading icon is on",isLoadingOn);
	}, 100);

	$("#add_new_shoppingList").on('click', function() {
		const $form = $(this).parents("form");
		const list_name = $("#list_name", $form).val();
		const list_comment = $("#list_comment", $form).val() || " ";
		let list_status = "30";
		if (gRoleId == 1 || gRoleId == 2 || gRoleId == 10) {
			list_status = "0";
		}

		const postData = {
			"store_hash": bypass_store_hash,
			"company_id": bypass_company_id,
			"customer_id": `${bypass_customer_id}`,
			"name": list_name,
			"description": list_comment,
			"products": [],
			"status": list_status
		};
		//console.log("added new shopping list request", postData);

		$overlay.show();

		$.ajax({
			type: "POST",
			url: `${config.apiRootUrl}/requisitionlist?customer_id=${bypass_customer_id}`,
			data: JSON.stringify(postData),
			success: function(data) {
				//debugger
				console.log("2-17-1 added shopping list", data);

				$newShoppingListModal.find(".modal-close").eq(0).click();
				load_table();

			},
			error: function(jqXHR, textStatus, errorThrown) {
				$overlay.hide();
				console.log("error", JSON.stringify(jqXHR));
			}
		});

	});

}