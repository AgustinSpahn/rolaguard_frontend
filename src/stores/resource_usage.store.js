import { observable, action } from "mobx";
import AuthStore from "./auth.store";
import API from "../util/api";
import _ from "lodash";

class ResourceUsageStore {
  @observable criteria = {
    // kepp data related to criteria filtering on resource usage dashboard
    type: null, // device or gateway
    status: null, // connected or disconnected
    gateways: [],
  };
  /**********************************************************/
  /**********************************************************/
  @observable statusGraph = {
    // keep data related of status graph on resoruce usage dashbaord
    seriesSelected: null,
    isLoading: false,
  };
  @action getStatusLoading() {
    return this.statusGraph.isLoading;
  }
  @action setStatusLoading(val) {
    this.statusGraph.isLoading = val;
  }
  @action getStatusGraphSeriesSelected() {
    return this.statusGraph.seriesSelected;
  }
  @action setStatusGraphSeriesSelected(data) {
    this.statusGraph.seriesSelected = data;
  }
  /**********************************************************/
  /**********************************************************/
  @observable gatewaysGraph = {
    // keep data related of gateway graph on resoruce usage dashbaord
    seriesSelected: [],
    isLoading: false,
  };
  @action getGatewaysLoading() {
    return this.gatewaysGraph.isLoading;
  }
  @action setGatewaysLoading(val) {
    this.gatewaysGraph.isLoading = val;
  }
  @action getGatewayGraphSeriesSelected() {
    return this.gatewaysGraph.seriesSelected;
  }
  @action setGatewayGraphSeriesSelected(data) {
    let elementFoundIndex = this.gatewaysGraph.seriesSelected.findIndex((e) => {
      return e.id === data.id;
    });
    if (elementFoundIndex != -1) {
      //remove filter
      this.gatewaysGraph.seriesSelected.splice(elementFoundIndex, 1);
      let foundCriteria = this.criteria.gateways.findIndex((e) => {
        return e.id === data.id;
      });
      if (foundCriteria != -1) {
        this.criteria.gateways.splice(foundCriteria, 1);
      }
    } else {
      // add filter
      this.gatewaysGraph.seriesSelected.push(data);
      this.criteria.gateways.push(data);
    }
    //    this.gatewaysGraph.seriesSelected = {...this.gatewaysGraph.seriesSelected, ...data}
  }
  /**********************************************************/
  /**********************************************************/
  @action getCriteria() {
    return this.criteria;
  }

  @action deleteCriteria(data) {
    let deleteCriteria = {};

    if (_.isEmpty(data)) {
      // clear all
      this.setStatusGraphSeriesSelected(null); // clean selected status element on status graph!
      this.setGatewayGraphSeriesSelected(null); // clean selected status element on status graph!

      this.criteria = {
        type: null, // device or gateway
        status: null, // connected or disconnected
        gateway: [],
      };
    } else {
      let keyCriteriaToDelete = _.keys(data)[0];
      switch (keyCriteriaToDelete) {
        case "status":
          this.setStatusGraphSeriesSelected(null); // clean selected status element on status graph!
          this.criteria.status = null;
          break;
        case "types":
          this.criteria.type = null;
          break;
        case "gateways":
          this.setGatewayGraphSeriesSelected(data[keyCriteriaToDelete]);
          let foundItemToDelete = this.criteria.gateways.findIndex(
            (e) => e.id === data[keyCriteriaToDelete].id
          );
          if (foundItemToDelete != -1) {
            this.criteria.gateway.slice(foundItemToDelete, 1);
          }
          break;
      }
    }
  }

  @action setCriteria(data) {
    this.criteria = {
      ...this.criteria,
      ...(_.isFunction(data) ? data.call() : data),
    };
  }
  /**********************************************************/
  /**********************************************************/
  getHeaders() {
    return { Authorization: "Bearer " + AuthStore.access_token };
  }

  @action getAssets(pagination, criteria) {
    const { page, size } = pagination || {};
    const { status, type, gateways } = this.criteria || {};

    const headers = this.getHeaders();
    const params = {
      ...(status && { asset_status: this.criteria.status }),
      ...(type && { asset_type: this.criteria.type }),
      ...(gateways && { gateway_ids: gateways.map((e) => e.id) }),
      page,
      size,
    };
    return API.get(`resource_usage/list`, { headers, params });
  }

  // return resource usage global status (connected/disconnected)
  @action getAssetsCountStatus(criteria) {
    const { status, type, gateways } = this.criteria || {};
    const headers = this.getHeaders();
    const params = {
      ...(status && { asset_status: this.criteria.status }),
      ...(type && { asset_type: this.criteria.type }),
      ...(gateways && { gateway_ids: this.criteria.gateways.map((e) => e.id) }),
    };
    return API.get(`resource_usage/count/status`, { headers, params });
  }

  // return different gateways associated to resource usage
  @action getAssetsCountGateways(criteria) {
    const { status, type, gateways } = this.criteria || {};
    const headers = this.getHeaders();
    const params = {
      ...(status && { asset_status: this.criteria.status }),
      ...(type && { asset_type: this.criteria.type }),
      ...(gateways && { gateway_ids: this.criteria.gateways.map((e) => e.id) }),
    };

    return API.get(`resource_usage/count/gateway`, { headers, params });
  }
  /**********************************************************/
  /**********************************************************/
  @action formatApiData(data) {
    data.map((e) => {
      // preprocess data!
      e.type =
        e.type && !["gateway", "device"].includes(e.type.toLowerCase().trim())
          ? "unknown"
          : e.type.toLowerCase().trim();
      e.packets_down = {
        ...{
          total: "-",
          per_minute: "-",
          per_hour: "-",
          per_day: "-",
          percentage: "-",
        },
        ...e.packets_down,
      };
      e.packets_up = {
        ...{
          total: "-",
          per_minute: "-",
          per_hour: "-",
          per_day: "-",
          percentage: "-",
        },
        ...e.packets_up,
      };
      e.packets_lost = {
        ...{
          total: "-",
          per_minute: "-",
          per_hour: "-",
          per_day: "-",
          percentage: "-",
        },
        ...e.packets_lost,
      };
    });
    return { data: data };
  }

  @action getDummyDataForGraphs() {
    return {
      byType: {
        types: [{ label: "Gateway", qty: 5 }, { label: "Device", qty: 95 }],
        total: 100,
      },
      byStauts: {
        status: [
          { label: "Connected", qty: 5 },
          { label: "Disconnected", qty: 95 },
        ],
        total: 100,
      },
      bySignalStrength: {
        signalStrengths: [
          { qty: 17, text: "0 to -50 dBm", additionalText: "EXCELLENT" },
          { qty: 17, text: "-50 to -75 dBm", additionalText: "GREAT" },
          { qty: 17, text: "-75 to -100 dBm", additionalText: "OKAY" },
          { qty: 17, text: "-100 to -110 dBm", additionalText: "WEAK" },
          { qty: 17, text: "-110 to -120 dBm", additionalText: "UNUSABLE" },
          { qty: 17, text: "-120 to -130 dBm", additionalText: "DISCONNECTED" },
        ],
        total: 100,
      },
      byPacketLost: {
        packet_losts: [
          { qty: 10, text: "between 0 and 10%" },
          { qty: 60, text: "between 10 and 20%" },
          { qty: 110, text: "between 20 and 30%" },
          { qty: 160, text: "between 30 and 40%" },
          { qty: 210, text: "between 40 and 50%" },
          { qty: 260, text: "between 50 and 60%" },
          { qty: 310, text: "between 60 and 70%" },
          { qty: 360, text: "between 70 and 80%" },
          { qty: 410, text: "between 80 and 90%" },
          { qty: 460, text: "between 90 and 100%" },
        ],
        total: 100,
      },
    };
  }

  @action getDummyData() {
    let data = [
      {
        hex_id: "FFFFFFFFFF",
        name: "device name",
        type: "device",
        connected: true,
        max_rssi: 50,
        id: 1,
        data_collector: "Chirpstack.io",
        app_name: null,
        packets_down: {
          total: 3306,
          per_minute: 4.894177805965373,
          per_hour: 293.65066835792237,
          per_day: 7047.616040590136,
          percentage: 56.59020883259158,
        },
        packets_lost: {
          total: 3306,
          per_minute: 4.894177805965373,
          per_hour: 293.65066835792237,
          per_day: 7047.616040590136,
          percentage: 56.59020883259158,
        },
        packets_up: {
          total: 2536,
          per_minute: 3.754275534158556,
          per_hour: 225.25653204951337,
          per_day: 5406.15676918832,
          percentage: 43.40979116740842,
        },
      },
      {
        hex_id: "0000000000",
        name: "gateway name",
        type: "gateway",
        connected: true,
        max_rssi: 50,
        id: 1,
        data_collector: "Chirpstack.io",
        app_name: null,
        packets_down: {
          total: 3306,
          per_minute: 4.894177805965373,
          per_hour: 293.65066835792237,
          per_day: 7047.616040590136,
          percentage: 56.59020883259158,
        },
        packets_lost: {
          total: 3306,
          per_minute: 4.894177805965373,
          per_hour: 293.65066835792237,
          per_day: 7047.616040590136,
          percentage: 56.59020883259158,
        },
        packets_up: {
          total: 2536,
          per_minute: 3.754275534158556,
          per_hour: 225.25653204951337,
          per_day: 5406.15676918832,
          percentage: 43.40979116740842,
        },
      },
    ];
    return data;
  }
}
const store = new ResourceUsageStore();
export default store;