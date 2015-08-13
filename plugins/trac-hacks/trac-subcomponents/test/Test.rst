=======================================
Testing to Prepare for New Trac Version
=======================================

Both the Javascript code and the Trac plugin perform manipulation of the
original Trac HTML output. With each new version of Trac the hardcoded
elements need to be tested and verified. 


Testing of the python code
--------------------------

The web_ui.py code manipulates the following aspects:

* pre_process_request

  - path starts with '/admin/ticket/component'

    + This overrides the default Trac component save procedure
    + **Check** if the path of the admin page has changed
    + **Check** if Trac's procedure for saving a component has changed. See
      trac/ticket/admin.py _render_admin_panel
    + **Test** if renaming children still works

* post_process_request

  - path starts with '/ticket' or '/newticket'

    + This adds the javascript to relevant ticket pages
    + **Test** if the javascript is actually added
    + **Check** if the ticket paths are still correct   

  - template is "query.html"

    + This adds the option of searching for tickets with a specific parent 
      component. This needs the ^ operator
    + **Check** if the 'begins with' operator actually shows up in the Custom
      Query page.
    + **Check** if the template filename has not changed
    + **Test** whether selecting partial components works

  - template is "milestone_view.html"

    + This adds the option to group the open tickets by component. The code
      then makes sure that it is sorted by parent component, instead of all
      the separate child components
    + **Check** if the template filename has not changed
    + **Test** whether the view actually work
    + **Test** whether clicking on a component name will send you to a query
      page where the parent component name has the begins with operator set
    + **Check** if the ticket count for each master component is correct

* filter_stream

  - filename is "admin_components.html"

    + This adds the Rename children checkbox to the admin panel
    + **Check** if the name of the template has not changed
    + **Check** if the checkbox is in the panel on the right place (below the
      name edit)

  - path starts with '/query'

    + This adds the javascript to the query page.
    + **Check** if the path of the query page did not change
    + **Test** if the javascript is actually added


Testing of the Javascript
-------------------------

* initialiseComponents()

  - Query page: add filters

    + **Check** if the XPath to the filter selects is correct

  - Query page: batch modify

    + **Check** if the XPath to the batch modify is correct

  - Query page: existing filters
    
    + **Check** if the XPath to existing filters is correct

  - Ticket/Newticket page: component field
   
    + **Check** if the XPath to the field is correct

* convertQueryComponent()

  - **Check** if the XPath to the filter is still correct

* convertBatchModifyComponent()

  - **Check** if the XPath to the component field in the batch modify section
    is correct


Using the init-test-env.py tool
-------------------------------

In order to help test the right combination of components and subcomponents it
is possible to use the init-test-env.py tool to create a test environment with
various default components for testing. The components have a descriptive name
which should give an indication of how it functions. 
