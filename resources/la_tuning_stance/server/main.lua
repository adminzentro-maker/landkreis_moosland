ESX = exports["es_extended"]:getSharedObject()

RegisterNetEvent('la_tuning:saveVehicleMods')
AddEventHandler('la_tuning:saveVehicleMods', function(plate, mods)
    local src = source
    MySQL.Async.execute('UPDATE owned_vehicles SET vehicle = @mods WHERE plate = @plate', {
        ['@mods'] = json.encode(mods),
        ['@plate'] = plate
    }, function(rowsChanged)
        print('[la_tuning] Vehicle mods saved for plate: ' .. plate)
    end)
end)