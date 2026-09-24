<?php

/**
 * Province → city/municipality map for the PH location picker.
 * Capitals + major cities/municipalities per province (not every barangay).
 * Coords are city-center approximations used when the user picks from dropdowns.
 *
 * @return array<string, list<array{name: string, lat: float, lng: float}>>
 */
return [
    'Metro Manila' => [
        ['name' => 'Manila', 'lat' => 14.5995, 'lng' => 120.9842],
        ['name' => 'Quezon City', 'lat' => 14.6760, 'lng' => 121.0437],
        ['name' => 'Makati', 'lat' => 14.5547, 'lng' => 121.0244],
        ['name' => 'Pasig', 'lat' => 14.5764, 'lng' => 121.0851],
        ['name' => 'Taguig', 'lat' => 14.5176, 'lng' => 121.0509],
        ['name' => 'Pasay', 'lat' => 14.5378, 'lng' => 121.0014],
        ['name' => 'Parañaque', 'lat' => 14.4793, 'lng' => 121.0198],
        ['name' => 'Mandaluyong', 'lat' => 14.5794, 'lng' => 121.0359],
        ['name' => 'San Juan', 'lat' => 14.6019, 'lng' => 121.0355],
        ['name' => 'Marikina', 'lat' => 14.6507, 'lng' => 121.1029],
        ['name' => 'Caloocan', 'lat' => 14.6488, 'lng' => 120.9668],
        ['name' => 'Malabon', 'lat' => 14.6680, 'lng' => 120.9560],
        ['name' => 'Navotas', 'lat' => 14.6667, 'lng' => 120.9417],
        ['name' => 'Valenzuela', 'lat' => 14.7011, 'lng' => 120.9830],
        ['name' => 'Las Piñas', 'lat' => 14.4500, 'lng' => 120.9833],
        ['name' => 'Muntinlupa', 'lat' => 14.4081, 'lng' => 121.0415],
        ['name' => 'Pateros', 'lat' => 14.5445, 'lng' => 121.0686],
    ],
    'Abra' => [
        ['name' => 'Bangued', 'lat' => 17.5965, 'lng' => 120.6176],
        ['name' => 'Lagangilang', 'lat' => 17.6120, 'lng' => 120.7340],
    ],
    'Agusan del Norte' => [
        ['name' => 'Butuan', 'lat' => 8.9475, 'lng' => 125.5406],
        ['name' => 'Cabadbaran', 'lat' => 9.1228, 'lng' => 125.5344],
    ],
    'Agusan del Sur' => [
        ['name' => 'Prosperidad', 'lat' => 8.6100, 'lng' => 125.9150],
        ['name' => 'Bayugan', 'lat' => 8.7143, 'lng' => 125.7481],
        ['name' => 'San Francisco', 'lat' => 8.5056, 'lng' => 125.9772],
    ],
    'Aklan' => [
        ['name' => 'Kalibo', 'lat' => 11.7061, 'lng' => 122.3644],
        ['name' => 'Malay', 'lat' => 11.9000, 'lng' => 121.9167],
        ['name' => 'Banga', 'lat' => 11.6386, 'lng' => 122.3311],
    ],
    'Albay' => [
        ['name' => 'Legazpi', 'lat' => 13.1391, 'lng' => 123.7438],
        ['name' => 'Tabaco', 'lat' => 13.3586, 'lng' => 123.7336],
        ['name' => 'Ligao', 'lat' => 13.2411, 'lng' => 123.5381],
        ['name' => 'Daraga', 'lat' => 13.1617, 'lng' => 123.7122],
    ],
    'Antique' => [
        ['name' => 'San Jose de Buenavista', 'lat' => 10.7450, 'lng' => 121.9410],
        ['name' => 'Culasi', 'lat' => 11.4272, 'lng' => 122.0561],
    ],
    'Apayao' => [
        ['name' => 'Kabugao', 'lat' => 18.0230, 'lng' => 121.1840],
        ['name' => 'Luna', 'lat' => 18.3310, 'lng' => 121.2430],
    ],
    'Aurora' => [
        ['name' => 'Baler', 'lat' => 15.7589, 'lng' => 121.5625],
        ['name' => 'Casiguran', 'lat' => 16.2833, 'lng' => 122.1167],
    ],
    'Basilan' => [
        ['name' => 'Isabela City', 'lat' => 6.7042, 'lng' => 121.9711],
        ['name' => 'Lamitan', 'lat' => 6.6569, 'lng' => 122.1375],
    ],
    'Bataan' => [
        ['name' => 'Balanga', 'lat' => 14.6761, 'lng' => 120.5361],
        ['name' => 'Mariveles', 'lat' => 14.4339, 'lng' => 120.4856],
        ['name' => 'Dinalupihan', 'lat' => 14.8631, 'lng' => 120.4631],
    ],
    'Batanes' => [
        ['name' => 'Basco', 'lat' => 20.4486, 'lng' => 121.9703],
        ['name' => 'Mahatao', 'lat' => 20.4158, 'lng' => 121.9478],
    ],
    'Batangas' => [
        ['name' => 'Batangas City', 'lat' => 13.7567, 'lng' => 121.0583],
        ['name' => 'Lipa', 'lat' => 13.9411, 'lng' => 121.1622],
        ['name' => 'Tanauan', 'lat' => 14.0864, 'lng' => 121.1494],
        ['name' => 'Nasugbu', 'lat' => 14.0678, 'lng' => 120.6331],
        ['name' => 'Calatagan', 'lat' => 13.8322, 'lng' => 120.6322],
    ],
    'Benguet' => [
        ['name' => 'La Trinidad', 'lat' => 16.4550, 'lng' => 120.5875],
        ['name' => 'Baguio', 'lat' => 16.4023, 'lng' => 120.5960],
        ['name' => 'Itogon', 'lat' => 16.3639, 'lng' => 120.6769],
    ],
    'Biliran' => [
        ['name' => 'Naval', 'lat' => 11.5611, 'lng' => 124.3950],
        ['name' => 'Caibiran', 'lat' => 11.5728, 'lng' => 124.5819],
    ],
    'Bohol' => [
        ['name' => 'Tagbilaran', 'lat' => 9.6478, 'lng' => 123.8554],
        ['name' => 'Panglao', 'lat' => 9.5789, 'lng' => 123.7461],
        ['name' => 'Tubigon', 'lat' => 9.9517, 'lng' => 123.9617],
        ['name' => 'Ubay', 'lat' => 10.0561, 'lng' => 124.4728],
    ],
    'Bukidnon' => [
        ['name' => 'Malaybalay', 'lat' => 8.1575, 'lng' => 125.1278],
        ['name' => 'Valencia', 'lat' => 7.9064, 'lng' => 125.0942],
        ['name' => 'Manolo Fortich', 'lat' => 8.3694, 'lng' => 124.8642],
    ],
    'Bulacan' => [
        ['name' => 'Malolos', 'lat' => 14.8433, 'lng' => 120.8114],
        ['name' => 'San Jose del Monte', 'lat' => 14.8139, 'lng' => 121.0453],
        ['name' => 'Meycauayan', 'lat' => 14.7367, 'lng' => 120.9608],
        ['name' => 'Marilao', 'lat' => 14.7578, 'lng' => 120.9483],
        ['name' => 'Baliuag', 'lat' => 14.9544, 'lng' => 120.8969],
    ],
    'Cagayan' => [
        ['name' => 'Tuguegarao', 'lat' => 17.6132, 'lng' => 121.7270],
        ['name' => 'Aparri', 'lat' => 18.3572, 'lng' => 121.6411],
        ['name' => 'Gonzaga', 'lat' => 18.2594, 'lng' => 121.9936],
    ],
    'Camarines Norte' => [
        ['name' => 'Daet', 'lat' => 14.1122, 'lng' => 122.9553],
        ['name' => 'Jose Panganiban', 'lat' => 14.2906, 'lng' => 122.6919],
    ],
    'Camarines Sur' => [
        ['name' => 'Naga', 'lat' => 13.6218, 'lng' => 123.1948],
        ['name' => 'Pili', 'lat' => 13.5572, 'lng' => 123.2736],
        ['name' => 'Iriga', 'lat' => 13.4203, 'lng' => 123.4131],
    ],
    'Camiguin' => [
        ['name' => 'Mambajao', 'lat' => 9.2506, 'lng' => 124.7164],
        ['name' => 'Catarman', 'lat' => 9.1258, 'lng' => 124.6756],
    ],
    'Capiz' => [
        ['name' => 'Roxas City', 'lat' => 11.5853, 'lng' => 122.7511],
        ['name' => 'Panay', 'lat' => 11.5428, 'lng' => 122.7906],
    ],
    'Catanduanes' => [
        ['name' => 'Virac', 'lat' => 13.5848, 'lng' => 124.2374],
        ['name' => 'San Andres', 'lat' => 13.5972, 'lng' => 124.0969],
    ],
    'Cavite' => [
        ['name' => 'Trece Martires', 'lat' => 14.2814, 'lng' => 120.8669],
        ['name' => 'Bacoor', 'lat' => 14.4590, 'lng' => 120.9290],
        ['name' => 'Imus', 'lat' => 14.4297, 'lng' => 120.9367],
        ['name' => 'Dasmariñas', 'lat' => 14.3294, 'lng' => 120.9367],
        ['name' => 'Tagaytay', 'lat' => 14.1153, 'lng' => 120.9621],
        ['name' => 'Kawit', 'lat' => 14.4442, 'lng' => 120.9044],
    ],
    'Cebu' => [
        ['name' => 'Cebu City', 'lat' => 10.3157, 'lng' => 123.8854],
        ['name' => 'Mandaue', 'lat' => 10.3236, 'lng' => 123.9222],
        ['name' => 'Lapu-Lapu', 'lat' => 10.3103, 'lng' => 123.9494],
        ['name' => 'Talisay', 'lat' => 10.2447, 'lng' => 123.8494],
        ['name' => 'Toledo', 'lat' => 10.3772, 'lng' => 123.6386],
        ['name' => 'Danao', 'lat' => 10.5208, 'lng' => 124.0272],
        ['name' => 'Carcar', 'lat' => 10.1061, 'lng' => 123.6403],
    ],
    'Cotabato' => [
        ['name' => 'Kidapawan', 'lat' => 7.0083, 'lng' => 125.0894],
        ['name' => 'Midsayap', 'lat' => 7.1906, 'lng' => 124.5331],
        ['name' => 'Kabacan', 'lat' => 7.1167, 'lng' => 124.8167],
    ],
    'Davao de Oro' => [
        ['name' => 'Nabunturan', 'lat' => 7.6028, 'lng' => 125.9664],
        ['name' => 'Monkayo', 'lat' => 7.8156, 'lng' => 126.0544],
        ['name' => 'Compostela', 'lat' => 7.6692, 'lng' => 126.0892],
    ],
    'Davao del Norte' => [
        ['name' => 'Tagum', 'lat' => 7.4478, 'lng' => 125.8078],
        ['name' => 'Panabo', 'lat' => 7.3081, 'lng' => 125.6842],
        ['name' => 'Samal', 'lat' => 7.0744, 'lng' => 125.7089],
    ],
    'Davao del Sur' => [
        ['name' => 'Digos', 'lat' => 6.7497, 'lng' => 125.3572],
        ['name' => 'Davao City', 'lat' => 7.1907, 'lng' => 125.4553],
        ['name' => 'Bansalan', 'lat' => 6.7861, 'lng' => 125.2131],
    ],
    'Davao Occidental' => [
        ['name' => 'Malita', 'lat' => 6.4150, 'lng' => 125.6117],
        ['name' => 'Santa Maria', 'lat' => 6.5536, 'lng' => 125.4708],
    ],
    'Davao Oriental' => [
        ['name' => 'Mati', 'lat' => 6.9553, 'lng' => 126.2164],
        ['name' => 'Baganga', 'lat' => 7.5750, 'lng' => 126.5600],
    ],
    'Dinagat Islands' => [
        ['name' => 'San Jose', 'lat' => 10.0083, 'lng' => 125.5686],
        ['name' => 'Basilisa', 'lat' => 10.0667, 'lng' => 125.5967],
    ],
    'Eastern Samar' => [
        ['name' => 'Borongan', 'lat' => 11.6081, 'lng' => 125.4319],
        ['name' => 'Guiuan', 'lat' => 11.0333, 'lng' => 125.7244],
    ],
    'Guimaras' => [
        ['name' => 'Jordan', 'lat' => 10.6583, 'lng' => 122.5911],
        ['name' => 'Buenavista', 'lat' => 10.6983, 'lng' => 122.6483],
    ],
    'Ifugao' => [
        ['name' => 'Lagawe', 'lat' => 16.8003, 'lng' => 121.1214],
        ['name' => 'Banaue', 'lat' => 16.9186, 'lng' => 121.0592],
    ],
    'Ilocos Norte' => [
        ['name' => 'Laoag', 'lat' => 18.1978, 'lng' => 120.5956],
        ['name' => 'Batac', 'lat' => 18.0556, 'lng' => 120.5647],
        ['name' => 'Pagudpud', 'lat' => 18.5617, 'lng' => 120.7867],
    ],
    'Ilocos Sur' => [
        ['name' => 'Vigan', 'lat' => 17.5747, 'lng' => 120.3869],
        ['name' => 'Candon', 'lat' => 17.1947, 'lng' => 120.4475],
        ['name' => 'Narvacan', 'lat' => 17.4178, 'lng' => 120.4772],
    ],
    'Iloilo' => [
        ['name' => 'Iloilo City', 'lat' => 10.7202, 'lng' => 122.5621],
        ['name' => 'Passi', 'lat' => 11.1075, 'lng' => 122.6419],
        ['name' => 'Oton', 'lat' => 10.6931, 'lng' => 122.4736],
        ['name' => 'Santa Barbara', 'lat' => 10.8231, 'lng' => 122.5344],
    ],
    'Isabela' => [
        ['name' => 'Ilagan', 'lat' => 17.1486, 'lng' => 121.8892],
        ['name' => 'Cauayan', 'lat' => 16.9344, 'lng' => 121.7728],
        ['name' => 'Santiago', 'lat' => 16.6881, 'lng' => 121.5486],
    ],
    'Kalinga' => [
        ['name' => 'Tabuk', 'lat' => 17.4189, 'lng' => 121.4443],
        ['name' => 'Rizal', 'lat' => 17.5000, 'lng' => 121.6000],
    ],
    'La Union' => [
        ['name' => 'San Fernando', 'lat' => 16.6159, 'lng' => 120.3167],
        ['name' => 'Bauang', 'lat' => 16.5306, 'lng' => 120.3331],
        ['name' => 'Agoo', 'lat' => 16.3222, 'lng' => 120.3647],
    ],
    'Laguna' => [
        ['name' => 'Santa Cruz', 'lat' => 14.2814, 'lng' => 121.4161],
        ['name' => 'Calamba', 'lat' => 14.2117, 'lng' => 121.1653],
        ['name' => 'San Pablo', 'lat' => 14.0683, 'lng' => 121.3256],
        ['name' => 'Santa Rosa', 'lat' => 14.3122, 'lng' => 121.1114],
        ['name' => 'Biñan', 'lat' => 14.3425, 'lng' => 121.0806],
        ['name' => 'Los Baños', 'lat' => 14.1789, 'lng' => 121.2231],
    ],
    'Lanao del Norte' => [
        ['name' => 'Tubod', 'lat' => 8.0525, 'lng' => 123.7919],
        ['name' => 'Iligan', 'lat' => 8.2280, 'lng' => 124.2452],
        ['name' => 'Kapatagan', 'lat' => 7.9000, 'lng' => 123.7667],
    ],
    'Lanao del Sur' => [
        ['name' => 'Marawi', 'lat' => 8.0034, 'lng' => 124.2850],
        ['name' => 'Malabang', 'lat' => 7.5903, 'lng' => 124.0703],
    ],
    'Leyte' => [
        ['name' => 'Tacloban', 'lat' => 11.2447, 'lng' => 125.0039],
        ['name' => 'Ormoc', 'lat' => 11.0061, 'lng' => 124.6075],
        ['name' => 'Palo', 'lat' => 11.1578, 'lng' => 124.9908],
        ['name' => 'Baybay', 'lat' => 10.6786, 'lng' => 124.8006],
    ],
    'Maguindanao del Norte' => [
        ['name' => 'Datu Odin Sinsuat', 'lat' => 7.2389, 'lng' => 124.1833],
        ['name' => 'Cotabato City', 'lat' => 7.2236, 'lng' => 124.2464],
    ],
    'Maguindanao del Sur' => [
        ['name' => 'Buluan', 'lat' => 6.7200, 'lng' => 124.8017],
        ['name' => 'Shariff Aguak', 'lat' => 6.8647, 'lng' => 124.4417],
    ],
    'Marinduque' => [
        ['name' => 'Boac', 'lat' => 13.4461, 'lng' => 121.8400],
        ['name' => 'Santa Cruz', 'lat' => 13.4756, 'lng' => 122.0275],
    ],
    'Masbate' => [
        ['name' => 'Masbate City', 'lat' => 12.3694, 'lng' => 123.6247],
        ['name' => 'Aroroy', 'lat' => 12.5122, 'lng' => 123.3986],
    ],
    'Misamis Occidental' => [
        ['name' => 'Oroquieta', 'lat' => 8.4858, 'lng' => 123.8047],
        ['name' => 'Ozamiz', 'lat' => 8.1486, 'lng' => 123.8447],
        ['name' => 'Tangub', 'lat' => 8.0619, 'lng' => 123.7478],
    ],
    'Misamis Oriental' => [
        ['name' => 'Cagayan de Oro', 'lat' => 8.4542, 'lng' => 124.6319],
        ['name' => 'Gingoog', 'lat' => 8.8261, 'lng' => 125.1028],
        ['name' => 'El Salvador', 'lat' => 8.5631, 'lng' => 124.5222],
    ],
    'Mountain Province' => [
        ['name' => 'Bontoc', 'lat' => 17.0897, 'lng' => 120.9775],
        ['name' => 'Sagada', 'lat' => 17.0840, 'lng' => 120.9010],
    ],
    'Negros Occidental' => [
        ['name' => 'Bacolod', 'lat' => 10.6765, 'lng' => 122.9509],
        ['name' => 'Silay', 'lat' => 10.7990, 'lng' => 122.9742],
        ['name' => 'Talisay', 'lat' => 10.7375, 'lng' => 122.9664],
        ['name' => 'Kabankalan', 'lat' => 9.9833, 'lng' => 122.8167],
        ['name' => 'San Carlos', 'lat' => 10.4892, 'lng' => 123.4194],
    ],
    'Negros Oriental' => [
        ['name' => 'Dumaguete', 'lat' => 9.3068, 'lng' => 123.3054],
        ['name' => 'Bais', 'lat' => 9.5911, 'lng' => 123.1214],
        ['name' => 'Bayawan', 'lat' => 9.3647, 'lng' => 122.8056],
        ['name' => 'Tanjay', 'lat' => 9.5161, 'lng' => 123.1581],
    ],
    'Northern Samar' => [
        ['name' => 'Catarman', 'lat' => 12.4989, 'lng' => 124.6378],
        ['name' => 'Laoang', 'lat' => 12.5697, 'lng' => 125.0142],
    ],
    'Nueva Ecija' => [
        ['name' => 'Palayan', 'lat' => 15.5414, 'lng' => 121.0847],
        ['name' => 'Cabanatuan', 'lat' => 15.4860, 'lng' => 120.9730],
        ['name' => 'Gapan', 'lat' => 15.3072, 'lng' => 120.9464],
        ['name' => 'San Jose', 'lat' => 15.7906, 'lng' => 120.9900],
    ],
    'Nueva Vizcaya' => [
        ['name' => 'Bayombong', 'lat' => 16.4811, 'lng' => 121.1497],
        ['name' => 'Solano', 'lat' => 16.5194, 'lng' => 121.1811],
    ],
    'Occidental Mindoro' => [
        ['name' => 'Mamburao', 'lat' => 13.2233, 'lng' => 120.5961],
        ['name' => 'San Jose', 'lat' => 12.3528, 'lng' => 121.0675],
    ],
    'Oriental Mindoro' => [
        ['name' => 'Calapan', 'lat' => 13.4117, 'lng' => 121.1803],
        ['name' => 'Puerto Galera', 'lat' => 13.5017, 'lng' => 120.9542],
        ['name' => 'Naujan', 'lat' => 13.3236, 'lng' => 121.3028],
    ],
    'Palawan' => [
        ['name' => 'Puerto Princesa', 'lat' => 9.7392, 'lng' => 118.7353],
        ['name' => 'El Nido', 'lat' => 11.1790, 'lng' => 119.3900],
        ['name' => 'Coron', 'lat' => 12.0000, 'lng' => 120.2000],
        ['name' => 'Taytay', 'lat' => 10.8272, 'lng' => 119.5169],
    ],
    'Pampanga' => [
        ['name' => 'San Fernando', 'lat' => 15.0286, 'lng' => 120.6897],
        ['name' => 'Angeles', 'lat' => 15.1450, 'lng' => 120.5847],
        ['name' => 'Mabalacat', 'lat' => 15.2231, 'lng' => 120.5722],
        ['name' => 'Guagua', 'lat' => 14.9656, 'lng' => 120.6328],
    ],
    'Pangasinan' => [
        ['name' => 'Lingayen', 'lat' => 16.0219, 'lng' => 120.2319],
        ['name' => 'Dagupan', 'lat' => 16.0433, 'lng' => 120.3331],
        ['name' => 'Urdaneta', 'lat' => 15.9761, 'lng' => 120.5711],
        ['name' => 'San Carlos', 'lat' => 15.9281, 'lng' => 120.3486],
        ['name' => 'Alaminos', 'lat' => 16.1553, 'lng' => 119.9803],
    ],
    'Quezon' => [
        ['name' => 'Lucena', 'lat' => 13.9373, 'lng' => 121.6173],
        ['name' => 'Tayabas', 'lat' => 14.0258, 'lng' => 121.5925],
        ['name' => 'Sariaya', 'lat' => 13.9625, 'lng' => 121.5261],
        ['name' => 'Lucban', 'lat' => 14.1136, 'lng' => 121.5564],
    ],
    'Quirino' => [
        ['name' => 'Cabarroguis', 'lat' => 16.5111, 'lng' => 121.5211],
        ['name' => 'Diffun', 'lat' => 16.5964, 'lng' => 121.5031],
    ],
    'Rizal' => [
        ['name' => 'Antipolo', 'lat' => 14.6258, 'lng' => 121.1226],
        ['name' => 'Cainta', 'lat' => 14.5786, 'lng' => 121.1222],
        ['name' => 'Taytay', 'lat' => 14.5692, 'lng' => 121.1325],
        ['name' => 'Rodriguez', 'lat' => 14.7322, 'lng' => 121.1164],
        ['name' => 'Binangonan', 'lat' => 14.4646, 'lng' => 121.1929],
    ],
    'Romblon' => [
        ['name' => 'Romblon', 'lat' => 12.5751, 'lng' => 122.2696],
        ['name' => 'Odiongan', 'lat' => 12.4014, 'lng' => 121.9886],
    ],
    'Samar' => [
        ['name' => 'Catbalogan', 'lat' => 11.7753, 'lng' => 124.8861],
        ['name' => 'Calbayog', 'lat' => 12.0668, 'lng' => 124.5957],
    ],
    'Sarangani' => [
        ['name' => 'Alabel', 'lat' => 6.1022, 'lng' => 125.2919],
        ['name' => 'Glan', 'lat' => 5.8228, 'lng' => 125.2453],
    ],
    'Siquijor' => [
        ['name' => 'Siquijor', 'lat' => 9.2142, 'lng' => 123.5150],
        ['name' => 'Larena', 'lat' => 9.2492, 'lng' => 123.5925],
    ],
    'Sorsogon' => [
        ['name' => 'Sorsogon City', 'lat' => 12.9742, 'lng' => 124.0058],
        ['name' => 'Bulan', 'lat' => 12.6694, 'lng' => 123.8756],
        ['name' => 'Gubat', 'lat' => 12.9206, 'lng' => 124.1231],
    ],
    'South Cotabato' => [
        ['name' => 'Koronadal', 'lat' => 6.5033, 'lng' => 124.8469],
        ['name' => 'General Santos', 'lat' => 6.1164, 'lng' => 125.1716],
        ['name' => 'Polomolok', 'lat' => 6.2217, 'lng' => 125.0642],
    ],
    'Southern Leyte' => [
        ['name' => 'Maasin', 'lat' => 10.1336, 'lng' => 124.8447],
        ['name' => 'Sogod', 'lat' => 10.3861, 'lng' => 124.9806],
    ],
    'Sultan Kudarat' => [
        ['name' => 'Isulan', 'lat' => 6.6294, 'lng' => 124.5972],
        ['name' => 'Tacurong', 'lat' => 6.6928, 'lng' => 124.6764],
    ],
    'Sulu' => [
        ['name' => 'Jolo', 'lat' => 6.0522, 'lng' => 121.0022],
        ['name' => 'Patikul', 'lat' => 6.0667, 'lng' => 121.1000],
    ],
    'Surigao del Norte' => [
        ['name' => 'Surigao City', 'lat' => 9.7840, 'lng' => 125.4930],
        ['name' => 'Dapa', 'lat' => 9.7592, 'lng' => 126.0531],
    ],
    'Surigao del Sur' => [
        ['name' => 'Tandag', 'lat' => 9.0789, 'lng' => 126.1986],
        ['name' => 'Bislig', 'lat' => 8.2146, 'lng' => 126.3211],
    ],
    'Tarlac' => [
        ['name' => 'Tarlac City', 'lat' => 15.4755, 'lng' => 120.5963],
        ['name' => 'Capas', 'lat' => 15.3311, 'lng' => 120.5897],
        ['name' => 'Concepcion', 'lat' => 15.3247, 'lng' => 120.6553],
    ],
    'Tawi-Tawi' => [
        ['name' => 'Bongao', 'lat' => 5.0292, 'lng' => 119.7731],
        ['name' => 'Panglima Sugala', 'lat' => 5.0722, 'lng' => 119.8847],
    ],
    'Zambales' => [
        ['name' => 'Iba', 'lat' => 15.3275, 'lng' => 119.9783],
        ['name' => 'Olongapo', 'lat' => 14.8294, 'lng' => 120.2828],
        ['name' => 'Subic', 'lat' => 14.8794, 'lng' => 120.2344],
    ],
    'Zamboanga del Norte' => [
        ['name' => 'Dipolog', 'lat' => 8.5667, 'lng' => 123.3406],
        ['name' => 'Dapitan', 'lat' => 8.6547, 'lng' => 123.4244],
        ['name' => 'Sindangan', 'lat' => 8.2383, 'lng' => 122.9972],
    ],
    'Zamboanga del Sur' => [
        ['name' => 'Pagadian', 'lat' => 7.8257, 'lng' => 123.4370],
        ['name' => 'Zamboanga City', 'lat' => 6.9214, 'lng' => 122.0790],
    ],
    'Zamboanga Sibugay' => [
        ['name' => 'Ipil', 'lat' => 7.7844, 'lng' => 122.5861],
        ['name' => 'Titay', 'lat' => 7.8167, 'lng' => 122.5167],
    ],
];
