let layerControl;


function setControlLayer(map, osm, modis) {

    const baseTree = {
        label: "<span style='color: gray'>Grayscale</span>",
        layer: osm
    }
    let overlayTree =
        [{
            label: "<span style='color: gray'>All Satellites</span>",
            selectAllCheckbox: true,
            //layer: empty,
            //  radioGroup: 'aggregation',
            children: [{
                label: "<span style='color: gray'>Modis</span>",
                name: "Modis",
                selectAllCheckbox: true,
                collapsed: true,
                layer: modis,
            },/*{
                label: "<span style='color: gray'>Suomi</span>",
                name: "Suomi",
                selectAllCheckbox: true,
                collapsed: true,
                layer: suomi,
            },*/
            ]
        }
        ]
    layerControl = L.control.layers.tree(baseTree, overlayTree).addTo(map);
}