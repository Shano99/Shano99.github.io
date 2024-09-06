$(document).ready(function () { 

    // Event listener for dropdown items
    $('.w3-bar-item').click(function (e) {
      console.log("loading..");
      e.preventDefault();
      $('#placeholder-message').hide();
      var networkName = $(this).data('network');
      // loadNetworkGraph(networkName);
      const graphManager = createGraphManager();
      graphManager.loadNetworkGraph(networkName,false);
  });
  // Load default graph when the page opens
  // loadNetworkGraph('graph');
const graphManager = createGraphManager();
// graphManager.loadNetworkGraph('DD-Miner_embed',true);
  });