ESX = exports["es_extended"]:getSharedObject()

ESX.RegisterServerCallback('la_mdt:searchPerson', function(source, cb, searchName)
    MySQL.Async.fetchAll('SELECT * FROM users WHERE firstname LIKE @query OR lastname LIKE @query', {
        ['@query'] = '%' .. searchName .. '%'
    }, function(results)
        cb(results)
    end)
end)