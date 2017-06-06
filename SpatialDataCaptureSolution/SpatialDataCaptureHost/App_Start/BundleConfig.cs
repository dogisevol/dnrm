using System.Web;
using System.Web.Optimization;

namespace SpatialDataCaptureHost
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.UseCdn = true;

            bundles.Add(new StyleBundle("~/Content/css")
                .IncludeDirectory("~/Content/css", "*.css", true));
        }
    }
}
