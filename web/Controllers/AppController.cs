using Microsoft.AspNetCore.Mvc;

namespace OnlineFSM.Controllers
{
    public class AppController : Controller
    {
        public IActionResult Intro()
        {
            return View();
        }

        public IActionResult Designer()
        {
            return View();
        }

        public IActionResult Simulator()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View();
        }
    }
}