from trac.admin.console import TracAdmin
from trac.util.text import printout, printerr
import sys

if __name__ == "__main__":
    if len(sys.argv) != 2:
        printerr("Usage: %s <path>\nSupply the path where to create the test environment"
                 % (sys.argv[0]))
        sys.exit(-1)

    admin = TracAdmin(sys.argv[1])
    admin.onecmd("initenv \"trac-subcomponents test environment\" sqlite:db/trac.db")
    admin.onecmd("permission add anonymous TRAC_ADMIN")
    
    components = ("NoSubcomponents", 
        "SuperComponent", "SuperComponent/SubComponent1", 
        "SuperComponent/SubComponent2", 
        "ForcedSubcomponent/ForcedSub1/ForcedSubSub",
        "LeafTest", "LeafTest/HasEmptyLeaf", "LeafTest/HasEmptyLeaf/Sub1",
        "LeafTest/HasEmptyLeaf/Sub2", "LeafTest/NoEmptyLeaf/Sub1",
        "LeafTest/NoEmptyLeaf/Sub2", "SixSubLevels/s1/s2/s3/s4/s5/s6")
    for component in components:
        admin.onecmd("component add %s nobody" % (component,))
    
    printout("""
The test environment is set up at %s. You can run tracd to test this
environment. Please make sure that the trac-subcomponents plugin is loaded,
either by putting the plugin in %s/plugins, by making it available in general
or by manipulation PYTHON_PATH. """ % (sys.argv[1], sys.argv[1]))

    sys.exit(0)