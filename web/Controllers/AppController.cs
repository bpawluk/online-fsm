using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace OnlineFSM.Controllers
{
    public class AppController : Controller
    {
        public IActionResult Start()
        {
            return View();
        }
    }
}