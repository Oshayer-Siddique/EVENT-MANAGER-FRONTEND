import React from 'react';
import Link from "next/link";

const MelangeConcertSite = () => {
  const concerts = [
    {
      id: 1,
      title: "Live Beats 2025",
      date: "Dec 1, 2025 (Tuesday)",
      time: "4:00 pm - 9:30 pm",
      venue: "ICCB Arena, Dhaka",
      description: "Experience an electrifying night with international rock bands and local favourites performing live on one stage.",
      price: "Starts from $10",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop"
    },
    {
      id: 2,
      title: "Live Beats 2025",
      date: "Dec 1, 2025 (Tuesday)",
      time: "4:00 pm - 9:30 pm",
      venue: "ICCB Arena, Dhaka",
      description: "Experience an electrifying night with international rock bands and local favourites performing live on one stage.",
      price: "Starts from $10",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop"
    },
    {
      id: 3,
      title: "Live Beats 2025",
      date: "Dec 1, 2025 (Tuesday)",
      time: "4:00 pm - 9:30 pm",
      venue: "ICCB Arena, Dhaka",
      description: "Experience an electrifying night with international rock bands and local favourites performing live on one stage.",
      price: "Starts from $10",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop"
    },
    {
      id: 4,
      title: "Live Beats 2025",
      date: "Dec 1, 2025 (Tuesday)",
      time: "4:00 pm - 9:30 pm",
      venue: "ICCB Arena, Dhaka",
      description: "Experience an electrifying night with international rock bands and local favourites performing live on one stage.",
      price: "Starts from $10",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="text-2xl font-bold text-blue-600">Melange</div>
              <div className="text-sm text-gray-500 sm:ml-2">
                your gateway to entertainment
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Home
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Concert
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Fair
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Exhibition
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Movie
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Food Festival
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Photography
              </a>
            </nav>

<Link href="/signin">
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    Sign In
  </button>
</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-96 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=400&fit=crop')`,
          }}
        ></div>
        <div className="relative z-10 flex items-center justify-center h-full px-4 text-center">
          <div className="text-white max-w-2xl">
            <p className="text-base sm:text-lg mb-3">
              Your ticket to every event, at a fair price
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">
              Simple, reliable, and quick booking.
            </h1>
            <p className="text-lg sm:text-xl">
              Save time, money, and energy while securing your spot.
            </p>
          </div>
        </div>
      </section>

      {/* Concerts Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-8 sm:mb-12">
            Concerts
          </h2>

          <div className="space-y-12 sm:space-y-16">
            {concerts.map((concert, index) => (
              <div
                key={concert.id}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2">
                  <img
                    src={concert.image}
                    alt={concert.title}
                    className="w-full h-60 sm:h-80 object-cover rounded-lg shadow-lg"
                  />
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {concert.title}
                  </h3>

                  <div className="space-y-3 mb-6 text-sm sm:text-base">
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {concert.date} • {concert.time}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{concert.venue}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-6 leading-relaxed text-sm sm:text-base">
                    {concert.description}
                  </p>

                  <div className="flex items-center text-gray-600 mb-4 text-sm sm:text-base">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    <span className="font-semibold">{concert.price}</span>
                  </div>

                  <p className="text-blue-600 mb-6 cursor-pointer hover:underline text-sm sm:text-base">
                    Book early to avoid disappointment
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-xs sm:text-sm text-gray-600">
                      Available for sponsorship • Contact{" "}
                      <span className="text-blue-600">abc@gmail.com</span>
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold">
                      Book Ticket
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="text-2xl font-bold mb-4">Melange</div>
              <p className="text-blue-200 mb-4">your gateway to entertainment</p>
              <p className="text-blue-200 text-sm leading-relaxed">
                Discover what's happening near you. Get event updates, browse
                through hundreds of ticket deals straight to your inbox.
              </p>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Our Team
                  </a>
                </li>
              </ul>
            </div>

            {/* Know More */}
            <div>
              <h4 className="font-semibold mb-4">Know More</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms & Conditions
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <div className="flex flex-col sm:flex-row">
                <input
                  type="email"
                  placeholder="Email goes here"
                  className="flex-1 px-4 py-2 rounded-t-md sm:rounded-l-md sm:rounded-tr-none text-gray-900"
                />
                <button className="bg-blue-600 px-6 py-2 rounded-b-md sm:rounded-r-md sm:rounded-bl-none hover:bg-blue-700">
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-12 pt-8 text-center">
            <p className="text-blue-200 text-sm">
              &copy; 2024 "Melange" All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MelangeConcertSite;