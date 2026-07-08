export const fetchWithAuth = async (endpoint, options = {}) => {const response = await fetch(endpoint, {credentials:"include",
 ...options
});

 if (response.status === 401) {localStorage.removeItem("user");
 window.location.href ="/login";
}

 return response;
};