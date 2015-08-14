#!/usr/bin/env python

 #
 # Copyright 2009, Niels Sascha Reedijk <niels.reedijk@gmail.com>
 # All rights reserved. Distributed under the terms of the MIT License.
 #

from setuptools import setup

setup(
    name = 'TracSubcomponents',
    version = '1.2.0 exocad edition',
    packages = ['subcomponents'],
    package_data = { 'subcomponents': ['htdocs/*.js'] },

    author = 'Niels Sascha Reedijk',
    author_email = 'niels.reedijk@gmail.com',
    description = 'Provides support for subcomponents in the interface.',
    license = 'BSD',
    keywords = 'trac plugin ticket query components',
    url = 'http://hg.haiku-os.org/trac-subcomponents',
    classifiers = [
        'Framework :: Trac',
        #'Development Status :: 1 - Planning',
        #'Development Status :: 2 - Pre-Alpha',
        # 'Development Status :: 3 - Alpha',
        # 'Development Status :: 4 - Beta',
        'Development Status :: 5 - Production/Stable',
        # 'Development Status :: 6 - Mature',
        # 'Development Status :: 7 - Inactive',
        'Environment :: Web Environment',
        'License :: OSI Approved :: BSD License',
        'Natural Language :: English',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
    ],
    
    install_requires = ['Trac>=1.0.8dev',],

    entry_points = {
        'trac.plugins': [
            'subcomponents.web_ui = subcomponents.web_ui',
        ]
    }
)
