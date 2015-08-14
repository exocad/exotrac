/*
 * Copyright 2006, John Drinkwater <john@nextraweb.com>
 * Distributed under the terms of the MIT License.
 * Please note, this script isn't as DOM friendly as I would like, 
 * but IE, as always, has problems with <select> and <option>s
 * Version 1j, from http://ezri.nextraweb.com/examples/js/haiku/rev1j/componentselect.js
 * Thanks to wkornew & tic
 */

/*
 * Rewritten & maintained by Niels Sascha Reedijk <niels.reedijk@gmail.com>
 * Copyright 2012.
*/


function getLeafsForLevel(level, prefix, forceEmptyLeafs)
{
	var retVal = new Array();
	var previous = null;
	
	for (var i = 0; i < gComponentList.length; i++) {
		// Check if the current item has the right prefix
		if (gComponentList[i].join('/').substring(0, prefix.length) != prefix){
			continue;
		}
		
		var current = gComponentList[i][level];
		if (!current){
			// This item has the right prefix, but no value. This means that
			// it is an empty leaf
			current = "";
		}
		
		if (current == previous)
			// this item is already in the list
			continue;
		
		retVal.push(current);
		previous = current;
	}
	
	if (retVal.length == 0 || ( retVal.length == 1 && retVal[0] == "" ))
		// There are no entries, or the only entry is an empty leaf
		return new Array();
	
	if (forceEmptyLeafs && retVal[0] != "")
		retVal.unshift("")
	
	return retVal;
}

//NEW vvvvv
/*
    Adjust size of elements after dropdown visibility changed
*/
function updateUIAfterComponentChange()
{
    var content_width = jQuery("#properties").outerWidth();
    var margin = Math.round((window.innerWidth - content_width) / 2);
    jQuery("#content.ticket").width(content_width).css("margin-left", margin).css("margin-right", margin);
}
//NEW ^^^^^

/*
	Event handler for when the user has changed the selected component
 */
function selectedComponentChanged(e) {
	// Get the level of this select
	var level = jQuery(this).prevAll('[class=haikucomponent]').length + 1;
	
	// Hide the deeper subcomponents (if applicable)
	jQuery(this).nextAll('[class=haikucomponent]').hide();
	
	// Check if the current selected value is an empty leaf
	if (jQuery(this).val().length == 0) {
		var prefix = ""
		jQuery(this).prevAll('[class=haikucomponent]').reverse()
			.each(function() {
				if (prefix.length != 0)
					prefix += "/"
				prefix += jQuery(this).val();
			});
		// Store the path of the previous leafs and end
		jQuery(this).parent().find("input[type=hidden]").val(prefix);
        //NEW vvvvv
		// Update UI
		updateUIAfterComponentChange();
        //NEW ^^^^^
		return;
	}
	
	// Just store the new path if this is the 'highest' level
	if (level == gMaxBranches) {
		var prefix = ""
		jQuery(this).parent().find('[class=haikucomponent]').each(function() {
			if (prefix.length != 0)
				prefix += "/";
			prefix += jQuery(this).val(); 
		});
		jQuery(this).parent().find("input[type=hidden]").val(prefix);
        //NEW vvvvv
        // Update UI
        updateUIAfterComponentChange();
        //NEW ^^^^^
		return;
	}
	
	// Empty the next selects
	jQuery(this).nextAll('[class=haikucomponent]').empty();
	
	// Fill the next selects with the right options. Sometimes that only means
	// that the next select is filled, at other times, we have to go deeper, 
	// for example when there are no empty leaves for a subcomponent.
	
	var prefix = "";
	jQuery(this).prevAll('[class=haikucomponent]').reverse().each(function() {
		prefix += jQuery(this).val(); 
		prefix += "/";
	});
	prefix += jQuery(this).val();
	
	var currentSelector = jQuery(this);
	for (var i = level; i < gMaxBranches; i++) {
		var items = getLeafsForLevel(i, prefix, e.data.forceEmptyLeafs);

		for (j = 0; j < items.length; j++)
			currentSelector.next().append(jQuery("<option/>", {
				value: items[j],
				text: items[j]
			}));
		
		// If there are any entries in the select to the right, show it
		// otherwise break out of the loop as we are done
		if (items.length)
			currentSelector.next().show();
		else
			break;
		
		// If the next selector has an empty leaf, then we are done. Otherwise
		// go deeper
		if (items[0] == "")
			break;
		
		prefix += "/"
		prefix += items[0]
		currentSelector = currentSelector.next()
	}		
	
	// Update the current selected value. The prefix string has the complete
	// path of the current selection
	jQuery(this).parent().find("input[type=hidden]").val(prefix);

    //NEW vvvvv
    // Update UI
    updateUIAfterComponentChange();
    //NEW ^^^^^
}


/*
	This function deletes the <select> box, replaces it with a hidden input 
	box, and as many <select>s as the first/selected component had parts: this
	new element has an  event that triggers on change, to add or remove 
	<select> boxes
	original: the <select> field that is to be replaced
	set: support multiple component fields, can leave null for autoincrement
	forceEmptyLeafs: add leafs that contain '', so users can pick super components
	                 used in the Query
*/
function convertComponentSelect(element, forceEmptyLeafs)
{
	var e = jQuery(element);
	var parent = jQuery(element).parent();

	gComponentCount ++;

	// Populate the global component list if it has not been populated before
	if ( gComponentList.length == 0 ) {
		var i = 0;
		e.find('option').each(function() {
			gComponentList[i] = jQuery(this).text().split('/');
			gMaxBranches = (gMaxBranches < gComponentList[i].length ? gComponentList[i].length : gMaxBranches);
			i++;
		});

		gComponentList.sort(); // so Trac can be lazy
	}
	
	// create some replacement dropdowns
	for (var i = 1; i <= gMaxBranches; i++) {
		parent.append(jQuery(document.createElement('select'))
			.attr('id', 'component-selector' + gComponentCount + '-' + i)
			.attr('class', 'haikucomponent')
			.change({forceEmptyLeafs: forceEmptyLeafs}, selectedComponentChanged));
	}
		
	// Store the current selected item 
	var currentItems = e.val().split('/');
	var currentSelectors = parent.find('[class=haikucomponent]');
	var prefix = "";
		
	// Populate choice(s)
	// Note: always use currentItems.length + 1 because we want to check
	// whether there are more subselections possible
	for (var i = 0; i < currentItems.length + 1; i++) {		
		var items = getLeafsForLevel(i, prefix, forceEmptyLeafs);

		for (j = 0; j < items.length; j++) {
			jQuery(currentSelectors[i]).append(jQuery("<option/>", {
				value: items[j],
				text: items[j]
			}));
		}

		if (items.length == 0) {
			break;
		}
		
		jQuery(currentSelectors[i]).val(currentItems[i]);
		
		// Add the current selected item to the prefix to prepare for the next
		// level
		if (prefix.length != 0)
			prefix += "/";
		if (currentItems[i] == "")
			// In case we have an 'emtpy' value, we only need to go once to get
			// the toplevel
			break;
		prefix += currentItems[i];
	}
		
	// Hide the unused inputs
	jQuery(currentSelectors[currentItems.length]).nextAll().hide();

	// Hide the highest input if there are no options
	var foo = jQuery(currentSelectors[currentItems.length]).children();
	if (jQuery(currentSelectors[currentItems.length]).children().length == 0)
		jQuery(currentSelectors[currentItems.length]).hide();
	
	// Replace the current selector with a hidden input field
	e.replaceWith(
		$(document.createElement('input'))
			.attr('id', e.attr('id'))
			.attr('name', e.attr('name'))
			.attr('value', e.val())
			.attr('type', "hidden")
	);
}

window.gComponentList = new Array( );
window.gMaxBranches = 0;
window.gComponentCount = 0;

/*
  We hook into the query page with this attached to the filter <select>
  We should be called after the component has been created if the browser
  follows the DOM way of thinking
 */
function convertQueryComponent() {
	jQuery('tr.component td.filter select').each(function () {
		if (this.name.match(/[0-9]+_component/g) )
			convertComponentSelect(this, true)
	});
}

function convertBatchModifyComponent() {
	jQuery('#batchmod_component td.batchmod_property select').each(function () {
		if (this.name == "batchmod_value_component")
			convertComponentSelect(this, false);
	});
}

function initialiseComponents() { 
	// Query page: add filters
	if (jQuery('[id^=add_filter_]').length)
		jQuery('[id^=add_filter_]').change(convertQueryComponent);
	
	// Query page: batch modify
	if (jQuery('#add_batchmod_field').length)
		jQuery('#add_batchmod_field').change(convertBatchModifyComponent);

	// Query page: existing filters
	jQuery('tr.component td.filter select').each( function () {
		convertComponentSelect(this, true)
	});
	
	// Ticket/Newticket page: component field 
	// Original comment: Opera picks up .names in getElementById(), hence it being at the end now
	if ( jQuery( '#field-component' ).length )
		convertComponentSelect( jQuery( '#field-component' )[0], false ); // For the new ticket page

	// Legacy: is this (still) necessary?
	// now we need to query any radio groups for Mozilla breakage: http://www.quirksmode.org/js/tests/moz_radios.html
	var brokMoz = jQuery('input[type="radio"]');
	if ( brokMoz.length > 0 ) {
		for (var i = 0; i < brokMoz.length; i++)
			{ if (brokMoz[i]) brokMoz[i].checked = brokMoz[i].defaultChecked; }
	}
	
	// Add the reverse function to jQuery, used by convertComponentSelect()
	jQuery.fn.reverse = [].reverse;
}

jQuery(document).ready(initialiseComponents);
