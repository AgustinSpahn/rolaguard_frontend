import React, { useState, useContext, useEffect } from "react";
import { MobXProviderContext } from "mobx-react";
import {
  Table,
  Label,
  Grid,
  Pagination,
  Segment,
  Icon
} from "semantic-ui-react";
import Moment from "react-moment";
import _ from "lodash";
import EmptyComponent from "../../utils/empty.component";
import AlertUtil from "../../../util/alert-util";
import DetailsAlertModal from "../../../components/details.alert.modal.component";
import AssetIdComponent from "../asset-id.component";
import DateFilterBar from "./date-filter-bar.component"

const ShowAlerts = (props) => {
  const colorsMap = AlertUtil.getColorsMap();
  const { commonStore } = useContext(
    MobXProviderContext
  );

  const [
    selectedAlert,
    setSelectedAlert,
  ] = useState({
    alert: {},
    alert_type: {},
  });

  const [alerts, setAlerts] = useState({});
  const [activePage, setActivePage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(
    true
  );
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [orderBy, setOrderBy] = useState([
    "created_at",
    "DESC",
  ]);
  const [dateFilter, setDateFilter] = useState({
    from: null,
    to: null,
  });
  const { type, id } = props;

  useEffect(() => {
    setIsLoading(true);
    const alertPromise = commonStore.getData(
      "alerts",
      {
        type: type,
        id: id,
      },

      {
        page: activePage,
        size: perPage,
        order_by: orderBy,
        "created_at[gte]": dateFilter.from,
        "created_at[lte]": dateFilter.to,
      }
    );
    Promise.all([alertPromise]).then(
      (response) => {
        setAlerts(response[0].data.alerts);
        setTotalItems(
          response[0].data.total_items
        );
        setTotalPages(
          response[0].data.total_pages
        );
        setIsLoading(false);
      }
    );
  }, [
    type,
    id,
    activePage,
    perPage,
    orderBy,
    dateFilter,
  ]);

  const handlePaginationChange = (
    e,
    { activePage }
  ) => {
    setActivePage(activePage);
  };

  const showAlertDetails = (data) => {
    setSelectedAlert({
      alert: data,
      alert_type: data.type,
    });
  };

  const toggleSort = (field) => {
    setOrderBy([
      field,
      orderBy[1] === "ASC" ? "DESC" : "ASC",
    ]);
  };

  const closeAlertDetails = () => {
    setSelectedAlert({
      alert: {},
      alert_type: {},
    });
  };

  const handleDateFilterChange = (date) => {
    setDateFilter((prevDate) => {
      return { ...prevDate, ...date };
    });
  };

  return (
    <React.Fragment>
      <h5
        class="ui inverted top attached header"
        style={{ height: "44px" }}
      >
        ALERTS{" "}
        {totalItems > 0 && (
          <Label color="red">{totalItems}</Label>
        )}
      </h5>

      <DateFilterBar
        onDateFilterChange={
          handleDateFilterChange
        }
      />

      <Segment attached>
        {totalItems > 0 && (
          <Table
            striped
            selectable
            className="animated fadeIn"
            basic="very"
            compact="very"
          >
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell collapsing>
                  RISK
                </Table.HeaderCell>
                <Table.HeaderCell>
                  DESCRIPTION
                </Table.HeaderCell>
                <Table.HeaderCell
                  collapsing
                  onClick={() =>
                    toggleSort("created_at")
                  }
                  style={{ cursor: "pointer" }}
                >
                  <Icon
                    name={`sort content ${
                      orderBy[1] === "ASC"
                        ? "ascending"
                        : "descending"
                    }`}
                    title={`toggle sort order content ${
                      orderBy[1] === "ASC"
                        ? "descending"
                        : "ascending"
                    }`}
                  />
                  DATE
                </Table.HeaderCell>
                <Table.HeaderCell collapsing>
                  {type === "gateway"
                    ? "DEVICE"
                    : "GATEWAY"}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {alerts.map((alert, index) => (
                <Table.Row
                  key={index}
                  style={{ cursor: "pointer" }}
                  positive={alert.resolved_at}
                >
                  <Table.Cell
                    onClick={() =>
                      showAlertDetails(alert)
                    }
                    collapsing
                  >
                    {_.get(
                      alert,
                      "type.risk"
                    ) && (
                      <Label
                        horizontal
                        style={{
                          backgroundColor:
                            colorsMap[
                              alert.type.risk
                            ],
                          color: "white",
                          borderWidth: 1,
                          borderColor:
                            colorsMap[
                              alert.type.risk
                            ],
                          width: "100px",
                        }}
                      >
                        {alert.type.risk}
                      </Label>
                    )}
                  </Table.Cell>
                  <Table.Cell
                    onClick={() =>
                      showAlertDetails(alert)
                    }
                  >
                    {alert.type.name}
                  </Table.Cell>
                  <Table.Cell
                    singleLine
                    onClick={() =>
                      showAlertDetails(alert)
                    }
                  >
                    {
                      <Moment format="MM/DD/YYYY hh:mm:ss a">
                        {alert.created_at}
                      </Moment>
                    }
                  </Table.Cell>

                  {!_.isEmpty(
                    selectedAlert.alert
                  ) && (
                    <DetailsAlertModal
                      loading={false}
                      alert={selectedAlert}
                      onClose={closeAlertDetails}
                    />
                  )}
                  <Table.Cell
                    className="upper"
                    style={{ maxWidth: "180px" }}
                    collapsing
                  >
                    <AssetIdComponent
                      id={
                        type === "gateway"
                          ? alert.device_id
                          : alert.gateway_id
                      }
                      type={
                        type === "gateway"
                          ? "device"
                          : "gateway"
                      }
                      hexId={
                        type === "gateway"
                          ? alert.parameters
                              .dev_eui ||
                            alert.parameters
                              .dev_addr
                          : alert.parameters
                              .gateway +
                            (alert.parameters
                              .gw_name
                              ? `(${alert.parameters.gw_name})`
                              : "")
                      }
                      showAsLink={true}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        {totalItems <= 0 && (
          <EmptyComponent emptyMessage="There are no alerts to show." />
        )}

        {totalPages > 1 && (
          <Grid className="segment centered">
            <Pagination
              size="mini"
              activePage={activePage}
              const
              onPageChange={
                handlePaginationChange
              }
              totalPages={totalPages}
            />
          </Grid>
        )}
      </Segment>
    </React.Fragment>
  );
}

export default ShowAlerts;
