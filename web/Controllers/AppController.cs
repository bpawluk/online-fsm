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

        [HttpGet("[controller]/[action]/{id?}", Name = "GetAutomata")]
        public IActionResult Simulator(string id)
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