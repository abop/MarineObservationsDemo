var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 500,
    height: 300,
    gridSize: 20,
    perpendicularLinks: true,
    model: graph
});

// Initialize & render stencil.
// ----------------------------

var stencil = new joint.ui.Stencil({
    graph: graph,
    paper: paper,
    width: 200,
    height: 150,
    search: { '*': ['type'] }
});
$('#stencil').append(stencil.render().el);

// Populate stencil.
// -----------------

var r = new joint.shapes.basic.Rect({ position: { x: 10, y: 10 }, size: { width: 50, height: 30 } });
var c = new joint.shapes.basic.Circle({ position: { x: 70, y: 10 }, size: { width: 50, height: 30 } });
var t = new joint.shapes.basic.Text({
    position: { x: 130, y: 10 }, size: { width: 50, height: 30 },
    attrs: { text: { text: 'Text' } }
});
var p = new joint.shapes.basic.Path({
    position: { x: 10, y: 50 }, size: { width: 50, height: 50 },
    attrs: {
        path: { d: 'M16,1.466C7.973,1.466,1.466,7.973,1.466,16c0,8.027,6.507,14.534,14.534,14.534c8.027,0,14.534-6.507,14.534-14.534C30.534,7.973,24.027,1.466,16,1.466z M14.757,8h2.42v2.574h-2.42V8z M18.762,23.622H16.1c-1.034,0-1.475-0.44-1.475-1.496v-6.865c0-0.33-0.176-0.484-0.484-0.484h-0.88V12.4h2.662c1.035,0,1.474,0.462,1.474,1.496v6.887c0,0.309,0.176,0.484,0.484,0.484h0.88V23.622z' }
    }
});
var i = new joint.shapes.basic.Image({
    position: { x: 70, y: 50 },
    size: { width: 50, height: 50 },
    attrs: {
        image: { width: 50, height: 50, 'xlink:href': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAIj0lEQVRogd2Za2wcVxXHf3f2vXayttd52o3yJK9GcpMUNQQIfQVKW6mK1ApVqgQigEBCQghVQUKtKiHBR6j4wEMIofKppRRVgAKl0FJISmijJqTNw2netuvY8Xu9692Ze/gwrzuzu46dIIdypNHM3Lnn3P//PO69MwMfclEN7pNAGrAWHs6sooEqYAPiN5oEksDinu/2fr/rtuX7crn04jp6noLZrGJ9/Pu4qj+iSKxdon1ij4MH5XJ1ou9y/2/e+c7GA8A44JjjWEBx49OnflX8yMa94zNgKfdQHihLuZ0s5d4rwj5N2zzjWlxgWsJrkfC+rs3XiekVMjB85vTBM89segIYAXTSGyMDLG3tXnPvaMUdvJlII++K16YMIEY/v00MI/FI+P3isnOZ2+4IHBmA1u419wNLgRJQ9vM8CyyTVDrRlgV75BKFDNRGLkdAmgNIo0NC8FrcQR3Dq2J4NX5E7BoND6xxj4fWeg3pdAJY7mHGj0ACyKE878S9ImFu+wCUMkh516Z+wxowUsUkTOzaHMckaDzOeZgDAgCq6kAmYRoMVeoMeSi1uLWhFSipL/KIvgkqlvvNIhKXquNi9e8jBGwd8xT1njW97TWjDeDKI2KOYhKXGOiG7Y36eIBsaUxAAaqmY56WkJCKedsyCzWWOs3mADO/46D9GtFmSjXQt3WI1yQAYDlCfaF5qIxAgIQpY/mNRo3MRiC4ljB6DSNikjXOjnsdLLKRCNQpe57xvW33HaPy9gtgT2MphQoOUB5spUDFV7cAtBgRkLDOUjky2x8jtXJbSMqIiokrjjdSA4FnRKLF5qXM+O+eQSrjWFYyAKrci3AF9i5ULA7iDe9PDOIZFxFEO8wMnKZ9//N1KeWDN880qAEA5SsEHjBqQCuQWhnSrYgyll6lXLCxPYQYZMzZzCwwNwpuJHRlqg58XT1KQKohgcB+GMYw5ABaJVFaQAlipo8Sr9AVSlTMWigdbYtpLS5jbLCPscmpMNoiYCWj9RCfgTxrqdgWMxoBw/tmJPzq1Vq7IFFuZ4MI+EGQug0ewIo1m+l64JtMZzopTl/h3IvfY3jwipdGboqZEfeJHDwzjYPCEkFLnvZkuWEEFGBFpjV/liBcoLSWwONxIoCbWr7BGIvEls/yvt0JNoh0k9v6GWTgZ0YaCeb4fia8MZgPptYVLVC9dBrcWWiWIiZMo2CRUtECNImE6RMaEyMSInBtdJz0Sv8ZDI+Oo0WHwP2JI14DAosy0JV3GDp7jLMnjjWMQGDY9b5ECtmf67UIystMJWENuB73JuiEhQSrUWh74vBzFIrrUIUu7Ku9TB19AdGG940UMteItQWQyX6O/elVSmMjTGd6IpGtjwDGXtzzuB8FvwbAn4QkKFp/St2060Gmhy9x4dTx6OwzNcLQc/tJ5DtxpoZQ6TxYych60GhR63v7j3xw7gTbN3Tzt8GVOLllDSOgiL1CxlMI5deABIBzuSwIzFSrKIQ123Yx2fMF8lRZl/4hve8cCkmoBCRz2OVxVLoFraxwHfAObQD3SaSn+/nR/k+yc12Rzd86DckcNKmBundgn4S/7GnRgcdTyQSbH/46qZZF9L78LKmWAuk932DIzjBOhs5PPcnG3I85/eZBbNsJh0ik0SLg5X8A1qgB8/zLL+2kvbCIRDoPKoBYt5WYVYLa8CKglGLDnkcYWHkftijWfW45VcfhilMIdK7OpGm786tsTqZ59/XfYjsOXas3UJspMdjf7wH3CGBEQCKlQzppNd2azJlAQMSbMdbd8XHKPV+kbLuGz6rVqGQ4O/kyWkth3/EVbm8pcu3k3+l4+CkSSpF/5Qec//chtNae3bAG5it1m7m5iNPzOBO1VKQtUI6RGK8qausfpX39Xi7W3Agtv//bbCv+ghOvvUS1Zs8ftYHXMhrm/B1ovFYfODEO82uDFpiqweVaIXg+UM0xuv1rfPSJpygUCnW25iBBEZug5xyB/4ZMVeF8xydY+8iBG1EPsN4yAuC+315wOm9EtfludC4i1TK6MnEjqg1t3YzMug7ExbIstNZMvHRDYb+u7fl09y/MWei6smrLDi6++xa6PBrdJtyEKKVQqSyrtu6kNE9VaLAXmk0Knz7AvXcdA+1cr+v8xEpwta2H0tzNNv6scj2tft1B/6K7541vTjI/n9StAx9aabobXXAgSti3aoyVqUl6y238oW/xbJ8Y57YbXUh5dOlFDv78Wc6fPM6du/dwz31f5tWRZc26129Lb7Ukrp6k9+R7SOE2jvzzCCtmeuekFyGggIoNVr4tOC+UXEss4fa77oFqid137+VMpRh+qIKm03ZkJU7UJimzCCvXRtkGK7dwBF5xdvDgQ118/vHH+NdInr9cW0qiFq72g9cmwErV6fkELCBZvXKc4ubdON5bWMqC5IIlmeIfEyt4bczdsbZlYaTvLLWaxeTkJM+/MQTZdhO3ZRIAoHruTZzCYlral9CSVuSV0JJQ0X9msbejyDfQRm9OkZ8k0vyZwJQjTGvFdFWYGhmEscu8fEhx4gPNi6c6oKWNJDXMN4gIAasyLQOHf62yy9dTtQXtvyIpD2YAUBk/BuLAm3xaDMAan9+8dvHOSimsZJpMNkttpkzFzvH0n/OQLUJrB6DI1gbtqQYEHGC6VM6MFlurHZXev6K0kGBhRSUzqHw7dr4dWrvQdJNvb4VUjoRlkVdTjJ9/fRT3D6VtEigBV8pHf/r7iV1P7sut2Npiz5SoVmuGQ5t4nwbPoT6dzAhEzoT3AigLqSRxKgp4HxRkMxlymQyl4QulytGfHAT6gGlz1CSwGtiBlfpYcsmWTZJoyTo3vWmzPJT6pl6WElYC5ZQq9tB7J9G1w8BbwEXANg2ngZVAN9Dp3f8vSRUYBi4DA959XR5YuP9gsw2e3WoRoAKUcb///n/IfwCA/cfu6DUO7AAAAABJRU5ErkJggg==' }
    }
});

stencil.load([r, c, t, p, i]);

graph.on('add', function(cell, collection, opt) {

    console.log('New cell with id ' + cell.id + ' was added from the stencil with id ' + opt.stencil + '.');
});


// Stencil with groups
// -------------------


var graph2 = new joint.dia.Graph;

var paper2 = new joint.dia.Paper({

    el: $('#paper2'),
    width: 500,
    height: 300,
    gridSize: 20,
    perpendicularLinks: true,
    model: graph2
});

// Initialize & render stencil.
// ----------------------------

var stencil2 = new joint.ui.Stencil({
    graph: graph2,
    paper: paper2,
    width: 200,
    groups: {
        simple: { label: 'Simple', index: 1 },
        text: { label: 'Text', index: 2, closed: true },
        advanced: { label: 'Advanced', index: 3, closed: true }
    },
    search: { '*': ['type'] }
});
$('#stencil2').append(stencil2.render().el);

// Populate stencil.
// -----------------

var r2 = new joint.shapes.basic.Rect({ position: { x: 10, y: 10 }, size: { width: 50, height: 30 } });
var c2 = new joint.shapes.basic.Circle({ position: { x: 70, y: 10 }, size: { width: 50, height: 30 } });
var t2 = new joint.shapes.basic.Text({
    position: { x: 10, y: 10 }, size: { width: 50, height: 30 },
    attrs: { text: { text: 'Text' } }
});
var p2 = new joint.shapes.basic.Path({
    position: { x: 10, y: 10 }, size: { width: 50, height: 50 },
    attrs: {
        path: { d: 'M16,1.466C7.973,1.466,1.466,7.973,1.466,16c0,8.027,6.507,14.534,14.534,14.534c8.027,0,14.534-6.507,14.534-14.534C30.534,7.973,24.027,1.466,16,1.466z M14.757,8h2.42v2.574h-2.42V8z M18.762,23.622H16.1c-1.034,0-1.475-0.44-1.475-1.496v-6.865c0-0.33-0.176-0.484-0.484-0.484h-0.88V12.4h2.662c1.035,0,1.474,0.462,1.474,1.496v6.887c0,0.309,0.176,0.484,0.484,0.484h0.88V23.622z' }
    }
});
var i2 = new joint.shapes.basic.Image({
    position: { x: 70, y: 10 },
    size: { width: 50, height: 50 },
    attrs: {
        image: { width: 50, height: 50, 'xlink:href': 'data:image/png;base64,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' }
    }
});

stencil2.load([r2, c2], 'simple');
stencil2.load([t2], 'text');
stencil2.load([p2, i2], 'advanced');
