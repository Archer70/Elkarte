/**
 * @name      ElkArte Forum
 * @copyright ElkArte Forum contributors
 * @license   BSD http://opensource.org/licenses/BSD-3-Clause
 *
 * This software is a derived product, based on:
 *
 * Simple Machines Forum (SMF)
 * copyright:	2011 Simple Machines (http://www.simplemachines.org)
 * license:  	BSD, See included LICENSE.TXT for terms and conditions.
 *
 * @version 1.0 Alpha
 *
 * Handle the JavaScript surrounding the admin and moderation center.
 */

/*
	elk_AdminIndex(oOptions)
	{
		public init()
		public loadAdminIndex()
		public setAnnouncements()
		public showCurrentVersion()
		public checkUpdateAvailable()
	}
*/
function elk_AdminIndex(oOptions)
{
	this.opt = oOptions;
	this.init();
}

elk_AdminIndex.prototype.init = function ()
{
	window.adminIndexInstanceRef = this;
	var fHandlePageLoaded = function () {
		window.adminIndexInstanceRef.loadAdminIndex();
	}
	addLoadEvent(fHandlePageLoaded);
}

elk_AdminIndex.prototype.loadAdminIndex = function ()
{
	// Load the text box containing the latest news items.
	if (this.opt.bLoadAnnouncements)
		this.setAnnouncements();

	// Load the current master and your version numbers.
	if (this.opt.bLoadVersions)
		this.showCurrentVersion();

	// Load the text box that sais there's a new version available.
	if (this.opt.bLoadUpdateNotification)
		this.checkUpdateAvailable();
}

elk_AdminIndex.prototype.setAnnouncements = function ()
{
	if (!('ourAnnouncements' in window) || !('length' in window.ourAnnouncements))
		return;

	var sMessages = '';
	for (var i = 0; i < window.ourAnnouncements.length; i++)
		sMessages += this.opt.sAnnouncementMessageTemplate.replace('%href%', window.ourAnnouncements[i].href).replace('%subject%', window.ourAnnouncements[i].subject).replace('%time%', window.ourAnnouncements[i].time).replace('%message%', window.ourAnnouncements[i].message);

	setInnerHTML(document.getElementById(this.opt.sAnnouncementContainerId), this.opt.sAnnouncementTemplate.replace('%content%', sMessages));
}

elk_AdminIndex.prototype.showCurrentVersion = function ()
{
	if (!('elkVersion' in window))
		return;

	var oElkVersionContainer = document.getElementById(this.opt.sOurVersionContainerId);
	var oYourVersionContainer = document.getElementById(this.opt.sYourVersionContainerId);

	setInnerHTML(oElkVersionContainer, window.elkVersion);

	var sCurrentVersion = getInnerHTML(oYourVersionContainer);
	if (sCurrentVersion !== window.elkVersion)
		setInnerHTML(oYourVersionContainer, this.opt.sVersionOutdatedTemplate.replace('%currentVersion%', sCurrentVersion));
}

elk_AdminIndex.prototype.checkUpdateAvailable = function ()
{
	if (!('ourUpdatePackage' in window))
		return;

	var oContainer = document.getElementById(this.opt.sUpdateNotificationContainerId);

	// Are we setting a custom title and message?
	var sTitle = 'ourUpdateTitle' in window ? window.ourUpdateTitle : this.opt.sUpdateNotificationDefaultTitle;
	var sMessage = 'ourUpdateNotice' in window ? window.ourUpdateNotice : this.opt.sUpdateNotificationDefaultMessage;

	setInnerHTML(oContainer, this.opt.sUpdateNotificationTemplate.replace('%title%', sTitle).replace('%message%', sMessage));

	// Parse in the package download URL if it exists in the string.
	document.getElementById('update-link').href = this.opt.sUpdateNotificationLink.replace('%package%', window.ourUpdatePackage);

	// If we decide to override life into "red" mode, do it.
	if ('elkUpdateCritical' in window)
	{
		document.getElementById('update_title').style.backgroundColor = '#dd2222';
		document.getElementById('update_title').style.color = 'white';
		document.getElementById('update_message').style.backgroundColor = '#eebbbb';
		document.getElementById('update_message').style.color = 'black';
	}
}

/*
	elk_ViewVersions(oOptions)
	{
		public init()
		public loadViewVersions
		public swapOption(oSendingElement, sName)
		public compareVersions(sCurrent, sTarget)
		public determineVersions()
	}
*/
function elk_ViewVersions (oOptions)
{
	this.opt = oOptions;
	this.oSwaps = {};
	this.init();
}

elk_ViewVersions.prototype.init = function ()
{
	// Load this on loading of the page.
	window.viewVersionsInstanceRef = this;
	var fHandlePageLoaded = function () {
		window.viewVersionsInstanceRef.loadViewVersions();
	}
	addLoadEvent(fHandlePageLoaded);
}

elk_ViewVersions.prototype.loadViewVersions = function ()
{
	this.determineVersions();
}

elk_ViewVersions.prototype.swapOption = function (oSendingElement, sName)
{
	// If it is undefined, or currently off, turn it on - otherwise off.
	this.oSwaps[sName] = !(sName in this.oSwaps) || !this.oSwaps[sName];
	if (this.oSwaps[sName])
		$("#" + sName).show(300);
	else
		$("#" + sName).hide(300);

	// Unselect the link and return false.
	oSendingElement.blur();
	return false;
}

elk_ViewVersions.prototype.compareVersions = function (sCurrent, sTarget)
{
	var aVersions = aParts = new Array();
	var aCompare = new Array(sCurrent, sTarget);

	for (var i = 0; i < 2; i++)
	{
		// Clean the version and extract the version parts.
		var sClean = aCompare[i].toLowerCase().replace(/ /g, '');
		aParts = sClean.match(/(\d+)(?:\.(\d+|))?(?:\.)?(\d+|)(?:(alpha|beta|rc)(\d+|)(?:\.)?(\d+|))?(?:(dev))?(\d+|)/);

		// No matches?
		if (aParts === null)
			return false;

		// Build an array of parts.
		aVersions[i] = [
			aParts[1] > 0 ? parseInt(aParts[1]) : 0,
			aParts[2] > 0 ? parseInt(aParts[2]) : 0,
			aParts[3] > 0 ? parseInt(aParts[3]) : 0,
			typeof(aParts[4]) === 'undefined' ? 'stable' : aParts[4],
			aParts[5] > 0 ? parseInt(aParts[5]) : 0,
			aParts[6] > 0 ? parseInt(aParts[6]) : 0,
			typeof(aParts[7]) !== 'undefined' ? 'dev' : ''
		];
	}

	// Loop through each category.
	for (i = 0; i < 7; i++)
	{
		// Is there something for us to calculate?
		if (aVersions[0][i] !== aVersions[1][i])
		{
			// Dev builds are a problematic exception.
			// (stable) dev < (stable) but (unstable) dev = (unstable)
			if (i === 3)
				return aVersions[0][i] < aVersions[1][i] ? !aVersions[1][6] : aVersions[0][6];
			else if (i === 6)
				return aVersions[0][6] ? aVersions[1][3] === 'stable' : false;
			// Otherwise a simple comparison.
			else
				return aVersions[0][i] < aVersions[1][i];
		}
	}

	// They are the same!
	return false;
}

elk_ViewVersions.prototype.determineVersions = function ()
{
	var oHighYour = {
		sources: '??',
		admin: '??',
		controllers: '??',
		database: '??',
		subs: '??',
		defaults: '??',
		Languages: '??',
		Templates: '??'
	};
	var oHighCurrent = {
		sources: '??',
		admin: '??',
		controllers: '??',
		database: '??',
		subs: '??',
		defaults: '??',
		Languages: '??',
		Templates: '??'
	};
	var oLowVersion = {
		sources: false,
		admin: false,
		controllers: false,
		database: false,
		subs: false,
		defaults: false,
		Languages: false,
		Templates: false
	};

	var sSections = [
		'sources',
		'admin',
		'controllers',
		'database',
		'subs',
		'defaults',
		'Languages',
		'Templates'
	];

	for (var i = 0, n = sSections.length; i < n; i++)
	{
		// Collapse all sections.
		var oSection = document.getElementById(sSections[i]);
		if (typeof(oSection) === 'object' && oSection !== null)
			oSection.style.display = 'none';

		// Make all section links clickable.
		var oSectionLink = document.getElementById(sSections[i] + '-link');
		if (typeof(oSectionLink) === 'object' && oSectionLink !== null)
		{
			oSectionLink.instanceRef = this;
			oSectionLink.sSection = sSections[i];
			oSectionLink.onclick = function () {
				this.instanceRef.swapOption(this, this.sSection);
				return false;
			};
		}
	}

	if (!('ourVersions' in window))
		window.ourVersions = {};

	// for each file in the detailed-version.js
	for (var sFilename in window.ourVersions)
	{
		if (!document.getElementById('our' + sFilename))
			continue;

		var sYourVersion = getInnerHTML(document.getElementById('your' + sFilename));
		var sCurVersionType;

		for (var sVersionType in oLowVersion)
			if (sFilename.substr(0, sVersionType.length) === sVersionType)
			{
				sCurVersionType = sVersionType;
				break;
			}

		// use compareVersion to determine which version is >< the other
		if (typeof(sCurVersionType) !== 'undefined')
		{
			if ((this.compareVersions(oHighYour[sCurVersionType], sYourVersion) || oHighYour[sCurVersionType] === '??') && !oLowVersion[sCurVersionType])
				oHighYour[sCurVersionType] = sYourVersion;

			if (this.compareVersions(oHighCurrent[sCurVersionType], ourVersions[sFilename]) || oHighCurrent[sCurVersionType] === '??')
				oHighCurrent[sCurVersionType] = ourVersions[sFilename];

			if (this.compareVersions(sYourVersion, ourVersions[sFilename]))
			{
				oLowVersion[sCurVersionType] = sYourVersion;
				document.getElementById('your' + sFilename).style.color = 'red';
			}
		}
		else if (this.compareVersions(sYourVersion, ourVersions[sFilename]))
			oLowVersion[sCurVersionType] = sYourVersion;

		setInnerHTML(document.getElementById('our' + sFilename), ourVersions[sFilename]);
		setInnerHTML(document.getElementById('your' + sFilename), sYourVersion);
	}

	if (!('ourLanguageVersions' in window))
		window.ourLanguageVersions = {};

	for (sFilename in window.ourLanguageVersions)
	{
		for (var i = 0; i < this.opt.aKnownLanguages.length; i++)
		{
			if (!document.getElementById('our' + sFilename + this.opt.aKnownLanguages[i]))
				continue;

			setInnerHTML(document.getElementById('our' + sFilename + this.opt.aKnownLanguages[i]), ourLanguageVersions[sFilename]);

			sYourVersion = getInnerHTML(document.getElementById('your' + sFilename + this.opt.aKnownLanguages[i]));
			setInnerHTML(document.getElementById('your' + sFilename + this.opt.aKnownLanguages[i]), sYourVersion);

			if ((this.compareVersions(oHighYour.Languages, sYourVersion) || oHighYour.Languages === '??') && !oLowVersion.Languages)
				oHighYour.Languages = sYourVersion;

			if (this.compareVersions(oHighCurrent.Languages, ourLanguageVersions[sFilename]) || oHighCurrent.Languages === '??')
				oHighCurrent.Languages = ourLanguageVersions[sFilename];

			if (this.compareVersions(sYourVersion, ourLanguageVersions[sFilename]))
			{
				oLowVersion.Languages = sYourVersion;
				document.getElementById('your' + sFilename + this.opt.aKnownLanguages[i]).style.color = 'red';
			}
		}
	}

	// Set the column titles based on the files each contain
	setInnerHTML(document.getElementById('yoursources'), oLowVersion.sources ? oLowVersion.sources : oHighYour.sources);
	setInnerHTML(document.getElementById('oursources'), oHighCurrent.sources);
	if (oLowVersion.sources)
		document.getElementById('yoursources').style.color = 'red';

	setInnerHTML(document.getElementById('youradmin'), oLowVersion.sources ? oLowVersion.sources : oHighYour.sources);
	setInnerHTML(document.getElementById('ouradmin'), oHighCurrent.sources);
	if (oLowVersion.sources)
		document.getElementById('youradmin').style.color = 'red';

	setInnerHTML(document.getElementById('yourcontrollers'), oLowVersion.sources ? oLowVersion.sources : oHighYour.sources);
	setInnerHTML(document.getElementById('ourcontrollers'), oHighCurrent.sources);
	if (oLowVersion.sources)
		document.getElementById('yourcontrollers').style.color = 'red';

	setInnerHTML(document.getElementById('yourdatabase'), oLowVersion.sources ? oLowVersion.sources : oHighYour.sources);
	setInnerHTML(document.getElementById('ourdatabase'), oHighCurrent.sources);
	if (oLowVersion.sources)
		document.getElementById('yourdatabase').style.color = 'red';

	setInnerHTML(document.getElementById('yoursubs'), oLowVersion.sources ? oLowVersion.sources : oHighYour.sources);
	setInnerHTML(document.getElementById('oursubs'), oHighCurrent.sources);
	if (oLowVersion.sources)
		document.getElementById('yoursubs').style.color = 'red';

	setInnerHTML(document.getElementById('yourdefault'), oLowVersion.defaults ? oLowVersion.defaults : oHighYour.defaults);
	setInnerHTML(document.getElementById('ourdefault'), oHighCurrent.defaults);
	if (oLowVersion.defaults)
		document.getElementById('yourdefaults').style.color = 'red';

	// Custom theme in use?
	if (document.getElementById('Templates'))
	{
		setInnerHTML(document.getElementById('yourTemplates'), oLowVersion.Templates ? oLowVersion.Templates : oHighYour.Templates);
		setInnerHTML(document.getElementById('ourTemplates'), oHighCurrent.Templates);

		if (oLowVersion.Templates)
			document.getElementById('yourTemplates').style.color = 'red';
	}

	setInnerHTML(document.getElementById('yourLanguages'), oLowVersion.Languages ? oLowVersion.Languages : oHighYour.Languages);
	setInnerHTML(document.getElementById('ourLanguages'), oHighCurrent.Languages);
	if (oLowVersion.Languages)
		document.getElementById('yourLanguages').style.color = 'red';
}

function addNewWord()
{
	setOuterHTML(document.getElementById('moreCensoredWords'), '<div style="margin-top: 1ex;"><input type="text" name="censor_vulgar[]" size="30" class="input_text" /> => <input type="text" name="censor_proper[]" size="30" class="input_text" /><' + '/div><div id="moreCensoredWords"><' + '/div>');
}

function toggleBBCDisabled(section, disable)
{
	elems = document.getElementById(section).getElementsByTagName('*');
	for (var i = 0; i < elems.length; i++)
	{
		if (typeof(elems[i].name) === "undefined" || (elems[i].name.substr((section.length + 1), (elems[i].name.length - 2 - (section.length + 1))) !== "enabledTags") || (elems[i].name.indexOf(section) !== 0))
			continue;

		elems[i].disabled = disable;
	}
	document.getElementById("bbc_" + section + "_select_all").disabled = disable;
}

function updateInputBoxes()
{
	curType = document.getElementById("field_type").value;
	privStatus = document.getElementById("private").value;
	document.getElementById("max_length_dt").style.display = curType === "text" || curType === "textarea" ? "" : "none";
	document.getElementById("max_length_dd").style.display = curType === "text" || curType === "textarea" ? "" : "none";
	document.getElementById("dimension_dt").style.display = curType === "textarea" ? "" : "none";
	document.getElementById("dimension_dd").style.display = curType === "textarea" ? "" : "none";
	document.getElementById("bbc_dt").style.display = curType === "text" || curType === "textarea" ? "" : "none";
	document.getElementById("bbc_dd").style.display = curType === "text" || curType === "textarea" ? "" : "none";
	document.getElementById("options_dt").style.display = curType === "select" || curType === "radio" ? "" : "none";
	document.getElementById("options_dd").style.display = curType === "select" || curType === "radio" ? "" : "none";
	document.getElementById("default_dt").style.display = curType === "check" ? "" : "none";
	document.getElementById("default_dd").style.display = curType === "check" ? "" : "none";
	document.getElementById("mask_dt").style.display = curType === "text" ? "" : "none";
	document.getElementById("mask").style.display = curType === "text" ? "" : "none";
	document.getElementById("can_search_dt").style.display = curType === "text" || curType === "textarea" ? "" : "none";
	document.getElementById("can_search_dd").style.display = curType === "text" || curType === "textarea" ? "" : "none";
	document.getElementById("regex_div").style.display = curType === "text" && document.getElementById("mask").value === "regex" ? "" : "none";
	document.getElementById("display").disabled = false;

	// Cannot show this on the topic
	if (curType === "textarea" || privStatus >= 2)
	{
		document.getElementById("display").checked = false;
		document.getElementById("display").disabled = true;
	}
}

function addOption()
{
	setOuterHTML(document.getElementById("addopt"), '<br /><input type="radio" name="default_select" value="' + startOptID + '" id="' + startOptID + '" class="input_radio" /><input type="text" name="select_option[' + startOptID + ']" value="" class="input_text" /><span id="addopt"></span>');
	startOptID++;
}


//Create a named element dynamically - thanks to: http://www.thunderguy.com/semicolon/2005/05/23/setting-the-name-attribute-in-internet-explorer/
function createNamedElement(type, name, customFields)
{
	var element = null;

	if (!customFields)
		customFields = "";

	// Try the IE way; this fails on standards-compliant browsers
	try
	{
		element = document.createElement("<" + type + ' name="' + name + '" ' + customFields + ">");
	}
	catch (e)
	{
	}
	if (!element || element.nodeName !== type.toUpperCase())
	{
		// Non-IE browser; use canonical method to create named element
		element = document.createElement(type);
		element.name = name;
	}

	return element;
}

function addAnotherQuestion()
{
	var placeHolder = document.getElementById('add_more_question_placeholder');

	setOuterHTML(placeHolder, add_question_template.easyReplace({
		question_last_blank: question_last_blank,
		setup_verification_add_more_answers: txt_add_another_answer
	}));

	question_last_blank++;
}

function addAnotherAnswer(elem, question_name)
{
	setOuterHTML(elem, add_answer_template.easyReplace({
		question_last_blank: question_name,
		setup_verification_add_more_answers: txt_add_another_answer
	}));
}

function addAnotherSearch(txt_name, txt_url, txt_word_sep)
{
	var placeHolder = document.getElementById('add_more_searches');

	var newDT = document.createElement("dt");
	var newInput = createNamedElement("input", "engine_name[]");
	newInput.type = "text";
	newInput.className = "input_text";
	newInput.size = "50";
	newInput.setAttribute("class", "verification_question");
	var newLabel = document.createElement("label");
	newLabel.textContent = txt_name + ': ';
	newLabel.appendChild(newInput);
	newDT.appendChild(newLabel);

	var newDD = document.createElement("dd");
	newInput = createNamedElement("input", "engine_url[]");
	newInput.type = "text";
	newInput.className = "input_text";
	newInput.size = "35";
	newInput.setAttribute("class", "input_text verification_answer");
	var newLabel = document.createElement("label");
	newLabel.textContent = txt_url + ': ';
	newLabel.appendChild(newInput);
	newDD.appendChild(newLabel);
	newDD.appendChild(document.createElement("br"));

	newInput = createNamedElement("input", "engine_separator[]");
	newInput.type = "text";
	newInput.className = "input_text";
	newInput.size = "5";
	newInput.setAttribute("class", "input_text verification_answer");
	var newLabel = document.createElement("label");
	newLabel.textContent = txt_word_sep + ': ';
	newLabel.appendChild(newInput);
	newDD.appendChild(newLabel);

	placeHolder.parentNode.insertBefore(newDT, placeHolder);
	placeHolder.parentNode.insertBefore(newDD, placeHolder);
}

// Add a new dt/dd pair above a parent selector
function addAnotherOption(parent, oDtName, oDdName)
{
	// Some defaults to use if none are passed
	oDtName['type'] = oDtName['type'] || 'text';
	oDtName['class'] = oDtName['class'] || 'input_text';
	oDtName['size'] = oDtName['size'] || '20';

	oDdName['type'] = oDdName['type'] || 'text';
	oDdName['class'] = oDdName['class'] || 'input_text';
	oDdName['size'] = oDdName['size'] || '20';

	// our new <dt> element
	var newDT = document.createElement('dt');
	var newInput = createNamedElement('input', oDtName['name']);
	newInput.type = oDtName['type'];
	newInput.setAttribute('class', oDtName['class']);
	newInput.size = oDtName['size'];
	newDT.appendChild(newInput);

	// and its matching <dd>
	var newDD = document.createElement('dd');
	newInput = createNamedElement('input', oDdName['name']);
	newInput.type = oDdName['type'];
	newInput.size = oDdName['size'];
	newInput.setAttribute('class', oDdName['class']);
	newDD.appendChild(newInput);

	// place the new dt/dd pair before our parent
	var placeHolder = document.getElementById(parent);
	placeHolder.parentNode.insertBefore(newDT, placeHolder);
	placeHolder.parentNode.insertBefore(newDD, placeHolder);
}

/**
 * News admin page
 */
function addAnotherNews()
{
	var $new_item = $("#list_news_lists_last").clone();

	last_preview++;
	$new_item.attr('id', 'list_news_lists_' + last_preview);
	$new_item.find('textarea').attr('id', 'data_' + last_preview);
	$new_item.find('#preview_last').attr('id', 'preview_' + last_preview);
	$new_item.find('#box_preview_last').attr('id', 'box_preview_' + last_preview);

	$("#list_news_lists_last").before($new_item);
	$new_item.toggle();
	make_preview_btn(last_preview);
}

function make_preview_btn (preview_id)
{
	var $id = $("#preview_" + preview_id);
	$id.text(txt_preview).click(function () {
		$.ajax({
			type: "POST",
			url: elk_scripturl + "?action=xmlpreview;xml",
			data: {item: "newspreview", news: $("#data_" + preview_id).val()},
			context: document.body
		})
		.done(function(request) {
			if ($(request).find("error").text() == '')
				$(document).find("#box_preview_" + preview_id).html($(request).text());
			else
				$(document).find("#box_preview_" + preview_id).text(txt_news_error_no_news);
		});
	});
	if (!$id.parent().hasClass('linkbutton_right'))
		$id.wrap('<a class="linkbutton_right" href="javascript:void(0);"></a>');
}

function elkSetLatestThemes()
{
	if (typeof(window.ourLatestThemes) !== "undefined")
		setInnerHTML(document.getElementById("themeLatest"), window.ourLatestThemes);

	if (tempOldOnload)
		tempOldOnload();
}

function changeVariant(sVariant)
{
	document.getElementById('variant_preview').src = oThumbnails[sVariant];
}

// The idea here is simple: don't refresh the preview on every keypress, but do refresh after they type.
function setPreviewTimeout()
{
	if (previewTimeout)
	{
		window.clearTimeout(previewTimeout);
		previewTimeout = null;
	}

	previewTimeout = window.setTimeout("refreshPreview(true); previewTimeout = null;", 500);
}

function toggleDuration(toChange)
{
	if (toChange === 'fixed')
	{
		document.getElementById("fixed_area").style.display = "inline";
		document.getElementById("flexible_area").style.display = "none";
	}
	else
	{
		document.getElementById("fixed_area").style.display = "none";
		document.getElementById("flexible_area").style.display = "inline";
	}
}

function toggleBreakdown(id_group, forcedisplayType)
{
	displayType = document.getElementById("group_hr_div_" + id_group).style.display === "none" ? "" : "none";
	if (typeof(forcedisplayType) !== "undefined")
		displayType = forcedisplayType;

	// swap the image
	document.getElementById("group_toggle_img_" + id_group).src = elk_images_url + "/" + (displayType === "none" ? "selected" : "selected_open") + ".png";

	// show or hide the elements
	var aContainer = new Array();
	for (i = 0; i < groupPermissions[id_group].length; i++)
	{
		var oContainerTemp = document.getElementById("perm_div_" + id_group + "_" + groupPermissions[id_group][i]);
		if (typeof(oContainerTemp) === 'object' && oContainerTemp !== null)
			aContainer[i] = oContainerTemp;
	}
	if (displayType === "none")
		$(aContainer).fadeOut();
	else
		$(aContainer).show();

	// remove or add the separators
	document.getElementById("group_hr_div_" + id_group).style.display = displayType;

	return false;
}

function calculateNewValues()
{
	var total = 0;
	for (var i = 1; i <= 6; i++)
	{
		total += parseInt(document.getElementById('weight' + i + '_val').value);
	}
	setInnerHTML(document.getElementById('weighttotal'), total);
	for (var i = 1; i <= 6; i++)
	{
		setInnerHTML(document.getElementById('weight' + i), (Math.round(1000 * parseInt(document.getElementById('weight' + i + '_val').value) / total) / 10) + '%');
	}
}

function switchType()
{
	document.getElementById("ul_settings").style.display = document.getElementById("method-existing").checked ? "none" : "";
	document.getElementById("ex_settings").style.display = document.getElementById("method-upload").checked ? "none" : "";
}

function swapUploads()
{
	document.getElementById("uploadMore").style.display = document.getElementById("uploadSmiley").disabled ? "none" : "";
	document.getElementById("uploadSmiley").disabled = !document.getElementById("uploadSmiley").disabled;
}

function selectMethod(element)
{
	document.getElementById("method-existing").checked = element !== "upload";
	document.getElementById("method-upload").checked = element === "upload";
}

function updatePreview()
{
	var currentImage = document.getElementById("preview");
	currentImage.src = elk_smiley_url + "/" + document.forms.smileyForm.set.value + "/" + document.forms.smileyForm.smiley_filename.value;
}

function swap_database_changes()
{
	db_vis = !db_vis;
	database_changes_area.style.display = db_vis ? "" : "none";
	return false;
}

function testFTP()
{
	ajax_indicator(true);

	// What we need to post.
	var oPostData = {
		0: "ftp_server",
		1: "ftp_port",
		2: "ftp_username",
		3: "ftp_password",
		4: "ftp_path"
	};

	var sPostData = "";
	for (i = 0; i < 5; i++)
		sPostData = sPostData + (sPostData.length === 0 ? "" : "&") + oPostData[i] + "=" + escape(document.getElementById(oPostData[i]).value);

	// Post the data out.
	sendXMLDocument(elk_prepareScriptUrl(elk_scripturl) + 'action=admin;area=packages;sa=ftptest;xml;' + elk_session_var + '=' + elk_session_id, sPostData, testFTPResults);
}

function expandFolder(folderIdent, folderReal)
{
	// See if it already exists.
	var possibleTags = document.getElementsByTagName("tr");
	var foundOne = false;

	for (var i = 0; i < possibleTags.length; i++)
	{
		if (possibleTags[i].id.indexOf("content_" + folderIdent + ":-:") === 0)
		{
			possibleTags[i].style.display = possibleTags[i].style.display === "none" ? "" : "none";
			foundOne = true;
		}
	}

	// Got something then we're done.
	if (foundOne)
	{
		return false;
	}
	// Otherwise we need to get the wicked thing.
	else if (window.XMLHttpRequest)
	{
		ajax_indicator(true);
		getXMLDocument(elk_prepareScriptUrl(elk_scripturl) + 'action=admin;area=packages;onlyfind=' + escape(folderReal) + ';sa=perms;xml;' + elk_session_var + '=' + elk_session_id, onNewFolderReceived);
	}
	// Otherwise reload.
	else
		return true;

	return false;
}

function dynamicExpandFolder()
{
	expandFolder(this.ident, this.path);

	return false;
}

function repeatString(sString, iTime)
{
	if (iTime < 1)
		return '';
	else
		return sString + repeatString(sString, iTime - 1);
}

function select_in_category(cat_id, elem, brd_list)
{
	for (var brd in brd_list)
		document.getElementById(elem.value + '_brd' + brd_list[brd]).checked = true;

	elem.selectedIndex = 0;
}

/*
* Server Settings > Caching
*/
function toggleCache ()
{
	var memcache = document.getElementById('cache_memcached');
	var cachedir = document.getElementById('cachedir');
	memcache.disabled = cache_type.value !== "memcached";
	cachedir.disabled = cache_type.value !== "filebased";
}

/*
 * Attachments Settings
 */
function toggleSubDir ()
{
	var auto_attach = document.getElementById('automanage_attachments'),
		use_sub_dir = document.getElementById('use_subdirectories_for_attachments'),
		dir_elem = document.getElementById('basedirectory_for_attachments');

	use_sub_dir.disabled = !Boolean(auto_attach.selectedIndex);
	if (use_sub_dir.disabled)
	{
		$(use_sub_dir).slideUp();
		$('#setting_use_subdirectories_for_attachments').parent().slideUp();

		$(dir_elem).slideUp();
		$('#setting_basedirectory_for_attachments').parent().slideUp();
	}
	else
	{
		$(use_sub_dir).slideDown();
		$('#setting_use_subdirectories_for_attachments').parent().slideDown();

		$(dir_elem).slideDown();
		$('#setting_basedirectory_for_attachments').parent().slideDown();
	}
		toggleBaseDir();
}

function toggleBaseDir ()
{
	var auto_attach = document.getElementById('automanage_attachments');
	var sub_dir = document.getElementById('use_subdirectories_for_attachments');
	var dir_elem = document.getElementById('basedirectory_for_attachments');

	if (auto_attach.selectedIndex === 0)
	{
		dir_elem.disabled = 1;
	}
	else
		dir_elem.disabled = !sub_dir.checked;
}

// Drag and drop to reorder ID's via UI Sortable
(function($) {
	'use strict';
	$.fn.elkSortable = function(oInstanceSettings) {
		$.fn.elkSortable.oDefaultsSettings = {
			opacity: 0.7,
			cursor: 'move',
			axis: 'y',
			scroll: true,
			containment: 'parent',
			delay: 150,
			href: '', // If an error occurs redirect here
			tolerance: 'intersect', // mode to use for testing whether the item is hovering over another item.
			setorder: 'serialize', // how to return the data, really only supports serialize and inorder
			placeholder: '', // css class used to style the landing zone
			preprocess: '', // This function is called at the start of the update event (when the item is dropped) must in in global space
			tag: '#table_grid_sortable', // ID(s) of the container to work with, single or comma separated
			connect: '', // Use to group all related containers with a common CSS class
			sa: '', // Subaction that the xmlcontroller should know about
			title: '', // Title of the error box
			error: '', // What to say when we don't know what happened, like connection error
			token: '' // Security token if needed
		};

		// Account for any user options
		var oSettings = $.extend({}, $.fn.elkSortable.oDefaultsSettings, oInstanceSettings || {});

		// Divs to hold our responses
		var	ajax_infobar = document.createElement('div'),
			ajax_errorbox = document.createElement('div');

		// Prepare the infobar and errorbox divs to confirm valid responses or show an error
		$(ajax_infobar).css({'position': 'fixed', 'top': '0', 'left': '0', 'width': '100%'});
		$("body").append(ajax_infobar);
		$(ajax_infobar).slideUp();
		$(ajax_errorbox).css({'display': 'none'});
		$("body").append(ajax_errorbox).attr('id', 'errorContainer');

		// Find all oSettings.tag and attach the UI sortable action
		$(oSettings.tag).sortable({
			opacity: oSettings.opacity,
			cursor: oSettings.cursor,
			axis: oSettings.axis,
			containment: oSettings.containment,
			connectWith: oSettings.connect,
			placeholder: oSettings.placeholder,
			tolerance: oSettings.tolerance,
			delay: oSettings.delay,
			scroll: oSettings.scroll,
			update: function(e, ui) {
				// Called when an element is dropped in a new location
				var postdata = '',
					moved = ui.item.attr('id'),
					order = [],
					receiver = ui.item.parent().attr('id');

				// Calling a pre processing function?
				if (oSettings.preprocess !== '')
					window[oSettings.preprocess]();

				// How to post the sorted data
				if (oSettings.setorder === 'inorder')
				{
					// This will get the order in 1-n as shown on the screen
					$(oSettings.tag).find('li').each(function() {
						var aid = $(this).attr('id').split('_');
						order.push({name: aid[0] + '[]', value: aid[1]});
					});
					postdata = $.param(order);
				}
				else
				// Get all id's in all the sortable containers
				{
					$(oSettings.tag).each(function() {
						// Serialize will be 1-n of each nesting / connector
						if (postdata === "")
						   postdata += $(this).sortable(oSettings.setorder);
						else
						   postdata += "&" + $(this).sortable(oSettings.setorder);
					});
				}

				// Add in our security tags and additional options
				postdata += '&' + elk_session_var + '=' + elk_session_id;
				postdata += '&order=reorder';
				postdata += '&moved=' + moved;
				postdata += '&received=' + receiver;

				if (oSettings.token !== '')
					postdata += '&' + oSettings.token['token_var'] + '=' + oSettings.token['token_id'];

				// And with the post data prepared, lets make the ajax request
				$.ajax({
					type: "POST",
					url: elk_scripturl + "?action=xmlhttp;sa=" + oSettings.sa + ";xml",
					dataType: "xml",
					data: postdata
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					$(ajax_infobar).attr('class', 'errorbox');
					$(ajax_infobar).html(textStatus).slideDown('fast');
					setTimeout(function() {
						$(ajax_infobar).slideUp();
					}, 3500);
					// Reset the interface?
					if (oSettings.href !== '')
						setTimeout(function() {
							window.location.href = elk_scripturl + oSettings.href;
						}, 1000);
				})
				.done(function(data, textStatus, jqXHR) {
					if ($(data).find("error").length !== 0)
					{
						// Errors get a modal dialog box and redirect on close
						$('#errorContainer').append('<p id="errorContent"></p>');
						$('#errorContent').html($(data).find("error").text());
						$('#errorContent').dialog({
							autoOpen: true,
							title: oSettings.title,
							modal: true,
							close: function(event, ui) {
								// Redirecting due to the error, thats a good idea
								if (oSettings.href !== '')
									window.location.href = elk_scripturl + oSettings.href;
							}
						});
					}
					else if ($(data).find("elk").length !== 0)
					{
						// Valid responses get the unobtrusive slider
						$(ajax_infobar).attr('class', 'infobox');
						$(ajax_infobar).html($(data).find('elk > orders > order').text()).slideDown('fast');
						setTimeout(function() {
							$(ajax_infobar).slideUp();
						}, 3500);
					}
					else
					{
						// Something "other" happened ...
						$('#errorContainer').append('<p id="errorContent"></p>');
						$('#errorContent').html(oSettings.error + ' : ' + textStatus);
						$('#errorContent').dialog({autoOpen: true, title: oSettings.title, modal: true});
					}
				})
				.always(function(data, textStatus, jqXHR) {
					if (textStatus === 'success' && $(data).find("elk > tokens > token").length !== 0)
					{
						// Reset the token
						oSettings.token['token_id'] = $(data).find("tokens").find('[type="token"]').text();
						oSettings.token['token_var'] = $(data).find("tokens").find('[type="token_var"]').text();
					}
				});
			}
		});
	};
})(jQuery);

/**
 * Helper function used in the preprocess call for drag/drop boards
 * Sets the id of all 'li' elements to cat#,board#,childof# for use in the
 * $_POST back to the xmlcontroller
 */
function setBoardIds() {
	// For each category of board
	$("[id^=category_]").each(function() {
		var cat = $(this).attr('id').split('category_'),
			uls = $(this).find("ul");

		// First up add drop zones so we can drag and drop to each level
		if (uls.length === 1)
		{
			// A single empty ul in a category, this can happen when a cat is dragged empty
			if ($(uls).find("li").length === 0)
				$(uls).append('<li id="cbp_' + cat + ',-1,-1"></li>');
			// Otherwise the li's need a child ul so we have a "child-of" drop zone
			else
				$(uls).find("li:not(:has(ul))").append('<ul class="nolist"></ul>');
		}
		// All others normally
		else
			$(uls).find("li:not(:has(ul))").append('<ul class="nolist"></ul>');

		// Next make find all the ul's in this category that have children, update the
		// id's with information that indicates the 1-n and parent/child info
		$(this).find('ul:parent').each(function(i, ul) {

			// Get the (li) parent of this ul
			var parentList = $(this).parent('li').attr('id'),
				pli = 0;

			// No parent, then its a base node 0, else its a child-of this node
			if (typeof(parentList) !== "undefined")
			{
				pli = parentList.split(",");
				pli = pli[1];
			}

			// Now for each li in this ul
			$(this).find('li').each(function(i, el) {
				var currentList =  $(el).attr('id');
				var myid = currentList.split(",");

				// Remove the old id, insert the newly computed cat,brd,childof
				$(el).removeAttr("id");
				myid = "cbp_" + cat[1] + "," + myid[1] + "," + pli;
				$(el).attr('id', myid);
			});
		});
	});
}