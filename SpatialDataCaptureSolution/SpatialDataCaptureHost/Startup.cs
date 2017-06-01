using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(SpatialDataCaptureHost.Startup))]
namespace SpatialDataCaptureHost
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
