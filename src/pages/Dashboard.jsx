export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-blue-600">LearnItBuildIt</div>
            <div className="flex space-x-4">
              <button className="text-gray-700 hover:text-blue-600">Profile</button>
              <button className="text-gray-700 hover:text-blue-600">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Dashboard!</h1>
          <p className="text-gray-600">You have successfully logged in.</p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-2">My Gigs</h3>
              <p className="text-gray-600">Manage your gigs</p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Orders</h3>
              <p className="text-gray-600">Track your orders</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Messages</h3>
              <p className="text-gray-600">Chat with clients</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
