 #
 # Copyright 2009, Niels Sascha Reedijk <niels.reedijk@gmail.com>
 # All rights reserved. Distributed under the terms of the MIT License.
 #

from pkg_resources import resource_filename
from genshi import HTML
from genshi.builder import tag
from genshi.filters.transform import Transformer

from trac.core import *
from trac.ticket import model
from trac.util.text import unicode_quote_plus
from trac.web.api import IRequestFilter
from trac.web.chrome import ITemplateProvider, ITemplateStreamFilter, add_notice, add_script
from trac.ticket.roadmap import TicketGroupStats
from trac.util.translation import _

from sys import stdout

class SubComponentsModule(Component):
    """Implements subcomponents in Trac's interface."""
    
    implements(IRequestFilter, ITemplateProvider, ITemplateStreamFilter)
 
    # IRequestFilter methods
    def pre_process_request(self, req, handler):
        if req.path_info.startswith('/admin/ticket/components/'):
            if req.method == "POST" and 'renamechildren' in req.args:
                if req.args.get('renamechildren') != 'on':
                    return handler # Let trac handle this update
                # First process the parent component. 
                parentcomponentname = req.path_info[25:]
                parentcomponent = model.Component(self.env, parentcomponentname)
                parentcomponent.name = req.args.get('name')
                parentcomponent.owner = req.args.get('owner')
                parentcomponent.description = req.args.get('description')
                try:
                    parentcomponent.update()
                except self.env.db_exc.IntegrityError:
                    raise TracError(_('The component "%(name)s" already '
                                      'exists.', name=parentcomponentname))
                    
                # Now update the child components
                childcomponents = self._get_component_children(parentcomponentname)
                for component in childcomponents:
                    component.name = component.name.replace(parentcomponentname, req.args.get('name'), 1)
                    component.update()
                add_notice(req, _('Your changes have been saved.'))
                req.redirect(req.href.admin('ticket', 'components'))
                
        return handler
    
    def post_process_request(self, req, template, data, content_type):
        # The /query paths are handled in filter_stream()
        if req.path_info.startswith('/ticket/') or \
           req.path_info.startswith('/newticket'):
            add_script(req, 'subcomponents/componentselect.js')
        
                                 
        if template == "query.html":
            # Allow users to query for parent components and include all subs
            data['modes']['select'].insert(0, {'name': "begins with", 'value': "^"})

        if template == "milestone_view.html":
            # Group components in the milestone view by base component.
            if data['grouped_by'] == "component":
                componentname = ''
                newgroups = []
                newcomponents = []
                for component in data['groups']:
                    componentname = component['name'].split('/')[0]
                    if componentname not in newcomponents:
                        # This component is not yet in the new list of components, add it.
                        newcomponents.append(componentname)
                        # Fix URLs to the querys (we use unicode_quote_plus to replace the '/'
                        # with something URL safe (like the hrefs are)
                        new_hrefs = []
                        for interval_href in component['interval_hrefs']:
                            new_hrefs.append(interval_href.replace(unicode_quote_plus(component['name']), '^' + componentname))
                        component['stats_href'] = component['stats_href'].replace(unicode_quote_plus(component['name']), '^' + componentname)
                        component['interval_hrefs'] = new_hrefs
                        # Set the name to the base name (in case this originally
                        # is a subcomponent.
                        component['name'] = componentname
                        
                        newgroups.append(component)
                    else:
                        # This is a subcomponent. Add the stats to the main component.
                        # Note that above two lists are created. Whenever an
                        # item is added to one, an analogous one is added to
                        # the other. This code uses that logic.
                        corecomponent = newgroups[newcomponents.index(componentname)]
                        mergedstats = corecomponent['stats'] #TicketGroupStats from trac.ticket.roadmap
                        newstats = component['stats']
                        
                        # Bear with me as we go to this mess that is the group stats
                        # (or of course this hack, depending on who's viewpoint).
                        # First merge the totals
                        mergedstats.count += newstats.count 
                        
                        # The stats are divided in intervals, merge these.
                        i = 0
                        for interval in mergedstats.intervals:
                            newinterval = newstats.intervals[i]
                            interval['count'] += newinterval['count']
                            i += 1
                        mergedstats.refresh_calcs()
                
                # Now store the new milestone component groups
                data['groups'] = newgroups
        return template, data, content_type        
 
  
    # ITemplateProvider methods
    def get_htdocs_dirs(self):
        """Return the absolute path of a directory containing additional
        static resources (such as images, style sheets, etc).
        """
        return [('subcomponents', resource_filename(__name__, 'htdocs'))]

    def get_templates_dirs(self):
        """Return the absolute path of the directory containing the provided
        ClearSilver templates.
        """
        return ""


    # ITemplateStreamFilter methods
    def filter_stream(self, req, method, filename, stream, data):
        if filename == "admin_components.html":
            # If we are at detail editing of a component, and it has
            # children, then add a checkbox to rename those.
            if data['view'] == 'detail':
                if len(self._get_component_children(data['component'].name)) > 0:
                    stream |= Transformer("//div[@class='field'][1]").after(self._build_renamechildren_field())
        elif req.path_info.startswith('/query'):
            # We need to load our script after the initializeFilters() call done by Trac
            html = HTML('<script type="text/javascript" charset="utf-8" src="' +
                        req.href.base +
                        '/chrome/subcomponents/componentselect.js"></script>')
            stream |= Transformer('//head').append(html)
        return stream
    
    
    # Other functions
    def _get_component_children(self, name):
        components = model.Component.select(self.env)
        result = []
        for component in components:
            if component.name.startswith(name) and component.name != name:
                result.append(component)
        return result
    
    def _build_renamechildren_field(self):
        return tag.div(tag.label(tag.input(_("Also rename children"), \
                                           type='checkbox', id='renamechildren', \
                                           name='renamechildren', checked='checked') \
                                ), \
                       class_='field')
